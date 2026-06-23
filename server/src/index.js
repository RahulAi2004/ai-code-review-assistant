import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import reviewRouter from './routes/review.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health check — handy for deployment platforms and quick sanity tests.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  });
});

app.use('/api', reviewRouter);

// Central error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Code Review API running on http://localhost:${PORT}`);
});
