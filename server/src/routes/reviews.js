import { Router } from 'express';
import { Review } from '../models/Review.js';
import { requireAuth, requireDB } from '../middleware/auth.js';
import { isDbReady } from '../db.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Save a review for a user, if the DB is available and the user is logged in.
 * Best-effort: never throws into the review request flow.
 * @returns {Promise<string|null>} the saved review id, or null if not saved.
 */
export async function saveReview({ userId, source, filename, review }) {
  if (!userId || !isDbReady() || !review) return null;
  try {
    const doc = await Review.create({
      user: userId,
      source: source || 'paste',
      filename: filename || null,
      language: review.language,
      score: review.score,
      summary: review.summary,
      issues: review.issues,
      strengths: review.strengths,
    });
    return String(doc._id);
  } catch (err) {
    console.error('[reviews] failed to save review:', err.message);
    return null;
  }
}

/**
 * GET /api/reviews — list the current user's review history (newest first).
 */
router.get(
  '/',
  requireDB,
  requireAuth,
  wrap(async (req, res) => {
    const reviews = await Review.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ reviews: reviews.map((r) => r.toListJSON()) });
  })
);

/**
 * GET /api/reviews/:id — fetch one full saved review (must belong to the user).
 */
router.get(
  '/:id',
  requireDB,
  requireAuth,
  wrap(async (req, res) => {
    const review = await Review.findOne({ _id: req.params.id, user: req.userId });
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    res.json({ review });
  })
);

/**
 * DELETE /api/reviews/:id — remove a saved review.
 */
router.delete(
  '/:id',
  requireDB,
  requireAuth,
  wrap(async (req, res) => {
    const result = await Review.deleteOne({ _id: req.params.id, user: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Review not found.' });
    res.json({ ok: true });
  })
);

export default router;
