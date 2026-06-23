import express from 'express';
import cors from 'cors';
import reviewRouter from './routes/review.js';
import authRouter from './routes/auth.js';
import reviewsRouter from './routes/reviews.js';
import { isDbReady } from './db.js';

// Builds and returns the configured Express app (without starting it).
// Kept separate from index.js so tests can import the app and drive it
// in-process without binding to a port.
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Health check — handy for deployment platforms and quick sanity tests.
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      dbConnected: isDbReady(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api', reviewRouter);

  // Central error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[error]', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
