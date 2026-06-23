import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewPrompt, REVIEW_JSON_SHAPE } from '../src/prompts/reviewPrompt.js';

test('buildReviewPrompt embeds the code to review', () => {
  const prompt = buildReviewPrompt({ code: 'const x = 1;', language: 'javascript' });
  assert.ok(prompt.includes('const x = 1;'), 'prompt should contain the code');
});

test('buildReviewPrompt includes the language hint when a language is given', () => {
  const prompt = buildReviewPrompt({ code: 'print(1)', language: 'python' });
  assert.ok(prompt.includes('python'), 'prompt should mention the language');
});

test('buildReviewPrompt asks the model to auto-detect when language is "auto"', () => {
  const prompt = buildReviewPrompt({ code: 'x', language: 'auto' });
  assert.ok(/detect/i.test(prompt), 'prompt should ask the model to detect the language');
});

test('buildReviewPrompt includes the filename when provided', () => {
  const prompt = buildReviewPrompt({ code: 'x', language: 'auto', filename: 'app.js' });
  assert.ok(prompt.includes('app.js'), 'prompt should mention the filename');
});

test('buildReviewPrompt embeds the required JSON shape contract', () => {
  const prompt = buildReviewPrompt({ code: 'x', language: 'auto' });
  assert.ok(prompt.includes(REVIEW_JSON_SHAPE), 'prompt should contain the JSON shape');
});
