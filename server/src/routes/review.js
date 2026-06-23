import { Router } from 'express';
import { reviewCode } from '../services/gemini.js';
import { fetchGithubFiles } from '../services/github.js';
import { optionalAuth } from '../middleware/auth.js';
import { saveReview } from './reviews.js';

const router = Router();

// Wrap async handlers so thrown errors reach the error middleware.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * POST /api/review
 * Body: { code, language?, filename?, source? }
 * Reviews a single snippet pasted or uploaded by the user.
 * If the request is authenticated, the review is saved to the user's history.
 */
router.post(
  '/review',
  optionalAuth,
  wrap(async (req, res) => {
    const { code, language, filename, source } = req.body || {};
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required.' });
    }
    const review = await reviewCode({ code, language, filename });
    const savedId = await saveReview({
      userId: req.userId,
      source: source === 'upload' ? 'upload' : 'paste',
      filename,
      review,
    });
    res.json({ filename: filename || null, review, savedId });
  })
);

/**
 * POST /api/review/github
 * Body: { url }
 * Fetches code from a public GitHub repo / PR / file URL and reviews each file.
 */
router.post(
  '/review/github',
  optionalAuth,
  wrap(async (req, res) => {
    const { url } = req.body || {};
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'Field "url" is required.' });
    }

    const { source, files } = await fetchGithubFiles(url);

    // Review each fetched file. Failures on one file shouldn't sink the others.
    const reviews = [];
    for (const file of files) {
      try {
        const review = await reviewCode({
          code: file.content,
          language: 'auto',
          filename: file.path,
        });
        const savedId = await saveReview({
          userId: req.userId,
          source: 'github',
          filename: file.path,
          review,
        });
        reviews.push({ filename: file.path, review, savedId });
      } catch (err) {
        reviews.push({ filename: file.path, error: err.message });
      }
    }

    res.json({ source, fileCount: files.length, reviews });
  })
);

export default router;
