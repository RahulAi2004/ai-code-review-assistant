import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

test('GET /api/health returns ok status', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.geminiConfigured, 'boolean');
});

test('POST /api/review without code returns 400', async () => {
  const res = await request(app).post('/api/review').send({});
  assert.equal(res.status, 400);
  assert.match(res.body.error, /code/i);
});

test('POST /api/review with blank code returns 400', async () => {
  const res = await request(app).post('/api/review').send({ code: '   ' });
  assert.equal(res.status, 400);
});

test('POST /api/review/github without url returns 400', async () => {
  const res = await request(app).post('/api/review/github').send({});
  assert.equal(res.status, 400);
  assert.match(res.body.error, /url/i);
});

test('unknown route returns 404', async () => {
  const res = await request(app).get('/api/does-not-exist');
  assert.equal(res.status, 404);
});
