import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubUrl } from '../src/services/github.js';

test('parseGithubUrl parses a plain repository URL', () => {
  const r = parseGithubUrl('https://github.com/facebook/react');
  assert.equal(r.type, 'repo');
  assert.equal(r.owner, 'facebook');
  assert.equal(r.repo, 'react');
});

test('parseGithubUrl strips a trailing .git', () => {
  const r = parseGithubUrl('https://github.com/owner/repo.git');
  assert.equal(r.type, 'repo');
  assert.equal(r.repo, 'repo');
});

test('parseGithubUrl parses a pull request URL', () => {
  const r = parseGithubUrl('https://github.com/owner/repo/pull/123');
  assert.equal(r.type, 'pr');
  assert.equal(r.number, '123');
});

test('parseGithubUrl parses a blob (single file) URL', () => {
  const r = parseGithubUrl('https://github.com/owner/repo/blob/main/src/app.js');
  assert.equal(r.type, 'file');
  assert.equal(r.branch, 'main');
  assert.equal(r.path, 'src/app.js');
});

test('parseGithubUrl throws on a non-GitHub URL', () => {
  assert.throws(() => parseGithubUrl('https://example.com/foo'), /parse/i);
});
