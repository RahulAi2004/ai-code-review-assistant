"""Fetch source files from a public GitHub repo / pull request / file URL so
they can be reviewed. Uses httpx (sync)."""
import os
import re
import base64

import httpx

GITHUB_API = "https://api.github.com"

# File extensions we treat as reviewable source code.
CODE_EXTENSIONS = {
    "js", "jsx", "ts", "tsx", "py", "java", "go", "rb", "php", "c", "cpp", "cc",
    "h", "hpp", "cs", "rs", "kt", "swift", "scala", "sh", "sql", "vue", "svelte",
}

# Cap how much we pull so a huge repo can't blow up the request or the AI cost.
MAX_FILES = 10
MAX_FILE_BYTES = 60_000


def _headers() -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ai-code-review-assistant",
    }
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _gh_get(client: httpx.Client, url: str):
    res = client.get(url, headers=_headers(), timeout=20)
    if res.status_code >= 400:
        body = (res.text or "")[:200]
        raise ValueError(f"GitHub API {res.status_code}: {res.reason_phrase} — {body}")
    return res


def _is_code_file(path: str) -> bool:
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return ext in CODE_EXTENSIONS


def parse_github_url(url: str) -> dict:
    """Parse a GitHub URL into its parts. Supports repo, /pull/N, and /blob/branch/path."""
    u = re.sub(r"\.git$", "", url.strip())
    m = re.search(
        r"github\.com/([^/]+)/([^/]+)(?:/(pull|blob|tree)/([^/]+)(?:/(.+))?)?", u, re.IGNORECASE
    )
    if not m:
        raise ValueError("Could not parse that as a GitHub URL.")
    owner, repo, kind, ref, rest = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    if kind == "pull":
        return {"type": "pr", "owner": owner, "repo": repo, "number": ref}
    if kind == "blob":
        return {"type": "file", "owner": owner, "repo": repo, "branch": ref, "path": rest}
    return {"type": "repo", "owner": owner, "repo": repo}


def _fetch_file_content(client, owner, repo, path, ref=None):
    from urllib.parse import quote

    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{quote(path)}"
    if ref:
        url += f"?ref={ref}"
    data = _gh_get(client, url).json()
    if data.get("size", 0) > MAX_FILE_BYTES:
        return None
    content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    return {"path": path, "content": content}


def _collect_from_file(client, src):
    f = _fetch_file_content(client, src["owner"], src["repo"], src["path"], src["branch"])
    return [f] if f else []


def _collect_from_pr(client, src):
    owner, repo, number = src["owner"], src["repo"], src["number"]
    files = _gh_get(client, f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{number}/files?per_page=100").json()
    pr = _gh_get(client, f"{GITHUB_API}/repos/{owner}/{repo}/pulls/{number}").json()
    head_ref = (pr.get("head") or {}).get("sha")

    code = [f for f in files if _is_code_file(f["filename"]) and f.get("status") != "removed"][:MAX_FILES]
    out = []
    for f in code:
        got = _fetch_file_content(client, owner, repo, f["filename"], head_ref)
        if got:
            out.append(got)
    return out


def _collect_from_repo(client, src):
    owner, repo = src["owner"], src["repo"]
    repo_data = _gh_get(client, f"{GITHUB_API}/repos/{owner}/{repo}").json()
    branch = repo_data["default_branch"]

    tree = _gh_get(client, f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1").json()
    nodes = [
        n
        for n in (tree.get("tree") or [])
        if n.get("type") == "blob" and _is_code_file(n["path"]) and n.get("size", 0) <= MAX_FILE_BYTES
    ][:MAX_FILES]

    out = []
    for n in nodes:
        got = _fetch_file_content(client, owner, repo, n["path"], branch)
        if got:
            out.append(got)
    return out


def fetch_github_files(url: str) -> dict:
    """Resolve a GitHub URL to a list of {path, content} source files."""
    parsed = parse_github_url(url)
    with httpx.Client() as client:
        if parsed["type"] == "file":
            files = _collect_from_file(client, parsed)
        elif parsed["type"] == "pr":
            files = _collect_from_pr(client, parsed)
        else:
            files = _collect_from_repo(client, parsed)

    if not files:
        raise ValueError("No reviewable source files found at that URL.")
    return {"source": parsed, "files": files}
