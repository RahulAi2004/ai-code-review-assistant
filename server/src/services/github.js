// Fetches source files from a public GitHub repo or pull request so they can be
// reviewed. Uses the built-in fetch (Node 18+) — no extra dependencies.

const GITHUB_API = 'https://api.github.com';

// File extensions we treat as reviewable source code.
const CODE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rb', 'php', 'c', 'cpp', 'cc',
  'h', 'hpp', 'cs', 'rs', 'kt', 'swift', 'scala', 'sh', 'sql', 'vue', 'svelte',
]);

// Cap how much we pull so a huge repo can't blow up the request or the AI cost.
const MAX_FILES = 10;
const MAX_FILE_BYTES = 60_000;

function ghHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ai-code-review-assistant',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function ghFetch(url) {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `GitHub API ${res.status}: ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`
    );
  }
  return res;
}

function isCodeFile(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  return ext && CODE_EXTENSIONS.has(ext);
}

/**
 * Parse a GitHub URL into its parts. Supports:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/pull/123
 *   https://github.com/owner/repo/blob/branch/path/to/file.js
 */
export function parseGithubUrl(url) {
  const u = url.trim().replace(/\.git$/, '');
  const m = u.match(/github\.com\/([^/]+)\/([^/]+)(?:\/(pull|blob|tree)\/([^/]+)(?:\/(.+))?)?/i);
  if (!m) throw new Error('Could not parse that as a GitHub URL.');
  const [, owner, repo, kind, ref, rest] = m;
  if (kind === 'pull') return { type: 'pr', owner, repo, number: ref };
  if (kind === 'blob') return { type: 'file', owner, repo, branch: ref, path: rest };
  return { type: 'repo', owner, repo };
}

async function fetchFileContent(owner, repo, path, ref) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${ref ? `?ref=${ref}` : ''}`;
  const res = await ghFetch(url);
  const data = await res.json();
  if (data.size > MAX_FILE_BYTES) {
    return null; // skip files that are too large to review cheaply
  }
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { path, content };
}

// A single file: github.com/owner/repo/blob/branch/path
async function collectFromFile({ owner, repo, branch, path }) {
  const file = await fetchFileContent(owner, repo, path, branch);
  return file ? [file] : [];
}

// A pull request: review only the files the PR changed.
async function collectFromPr({ owner, repo, number }) {
  const res = await ghFetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`);
  const files = await res.json();
  const prRes = await ghFetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}`);
  const pr = await prRes.json();
  const headRef = pr.head?.sha;

  const code = files.filter((f) => isCodeFile(f.filename) && f.status !== 'removed').slice(0, MAX_FILES);
  const out = [];
  for (const f of code) {
    const file = await fetchFileContent(owner, repo, f.filename, headRef);
    if (file) out.push(file);
  }
  return out;
}

// A whole repo: walk the default-branch tree and grab the first N code files.
async function collectFromRepo({ owner, repo }) {
  const repoRes = await ghFetch(`${GITHUB_API}/repos/${owner}/${repo}`);
  const repoData = await repoRes.json();
  const branch = repoData.default_branch;

  const treeRes = await ghFetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
  const tree = await treeRes.json();
  const codePaths = (tree.tree || [])
    .filter((n) => n.type === 'blob' && isCodeFile(n.path) && n.size <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES);

  const out = [];
  for (const node of codePaths) {
    const file = await fetchFileContent(owner, repo, node.path, branch);
    if (file) out.push(file);
  }
  return out;
}

/**
 * Resolve a GitHub URL to a list of { path, content } source files.
 */
export async function fetchGithubFiles(url) {
  const parsed = parseGithubUrl(url);
  let files = [];
  if (parsed.type === 'file') files = await collectFromFile(parsed);
  else if (parsed.type === 'pr') files = await collectFromPr(parsed);
  else files = await collectFromRepo(parsed);

  if (files.length === 0) {
    throw new Error('No reviewable source files found at that URL.');
  }
  return { source: parsed, files };
}
