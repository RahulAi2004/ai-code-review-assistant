import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';

// These tests spin up an in-memory MongoDB (via connectDB with no MONGODB_URI).
const app = createApp();

let token;
const creds = { name: 'Test User', email: 'test@example.com', password: 'secret123' };

before(async () => {
  await connectDB();
});

after(async () => {
  await disconnectDB();
});

test('register creates an account and returns a token', async () => {
  const res = await request(app).post('/api/auth/register').send(creds);
  assert.equal(res.status, 201);
  assert.ok(res.body.token, 'should return a token');
  assert.equal(res.body.user.email, 'test@example.com');
  token = res.body.token;
});

test('register rejects a duplicate email', async () => {
  const res = await request(app).post('/api/auth/register').send(creds);
  assert.equal(res.status, 409);
});

test('register rejects a short password', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'X', email: 'x@y.com', password: '123' });
  assert.equal(res.status, 400);
});

test('login succeeds with correct credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: creds.email, password: creds.password });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test('login fails with a wrong password', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: creds.email, password: 'wrongpass' });
  assert.equal(res.status, 401);
});

test('GET /api/auth/me requires a token', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

test('GET /api/auth/me returns the user with a valid token', async () => {
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, creds.email);
});

test('GET /api/reviews requires authentication', async () => {
  const res = await request(app).get('/api/reviews');
  assert.equal(res.status, 401);
});

test('GET /api/reviews returns an (initially empty) history for a user', async () => {
  const res = await request(app).get('/api/reviews').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.reviews));
});
