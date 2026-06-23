import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, normaliseReview } from '../src/services/gemini.js';

// ---------- extractJson ----------

test('extractJson parses a plain JSON object', () => {
  const obj = extractJson('{"summary":"ok","score":80}');
  assert.equal(obj.summary, 'ok');
  assert.equal(obj.score, 80);
});

test('extractJson parses JSON wrapped in a markdown code fence', () => {
  const text = '```json\n{"summary":"fenced","score":50}\n```';
  const obj = extractJson(text);
  assert.equal(obj.summary, 'fenced');
});

test('extractJson tolerates prose around the JSON', () => {
  const text = 'Here is your review: {"score": 42} — hope it helps!';
  const obj = extractJson(text);
  assert.equal(obj.score, 42);
});

test('extractJson throws when there is no JSON object', () => {
  assert.throws(() => extractJson('no json here'), /JSON/i);
});

// ---------- normaliseReview ----------

test('normaliseReview fills defaults for a sparse object', () => {
  const r = normaliseReview({}, 'python');
  assert.equal(r.language, 'python');
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.strengths, []);
  assert.equal(r.score, null);
});

test('normaliseReview rounds a numeric score', () => {
  const r = normaliseReview({ score: 87.6 }, 'auto');
  assert.equal(r.score, 88);
});

test('normaliseReview coerces an invalid severity to "info"', () => {
  const r = normaliseReview({ issues: [{ severity: 'apocalyptic', title: 'X' }] }, 'auto');
  assert.equal(r.issues[0].severity, 'info');
});

test('normaliseReview keeps a valid severity and integer line', () => {
  const r = normaliseReview(
    { issues: [{ severity: 'high', line: 12, title: 'Bug' }] },
    'auto'
  );
  assert.equal(r.issues[0].severity, 'high');
  assert.equal(r.issues[0].line, 12);
});

test('normaliseReview nulls a non-integer line', () => {
  const r = normaliseReview({ issues: [{ severity: 'low', line: 'oops' }] }, 'auto');
  assert.equal(r.issues[0].line, null);
});
