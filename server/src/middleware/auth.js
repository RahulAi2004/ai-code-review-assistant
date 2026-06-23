import jwt from 'jsonwebtoken';
import { isDbReady } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_EXPIRES = '7d';

// Sign a JWT for a user id.
export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Pull and verify the bearer token; returns the user id or null.
function readToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    return jwt.verify(token, JWT_SECRET).sub;
  } catch {
    return null;
  }
}

// Hard requirement: 401 if not authenticated.
export function requireAuth(req, res, next) {
  const userId = readToken(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });
  req.userId = userId;
  next();
}

// Soft: attaches req.userId if a valid token is present, otherwise continues
// as a guest. Used by the review endpoints so logged-in users get saved history.
export function optionalAuth(req, res, next) {
  req.userId = readToken(req);
  next();
}

// Guard for routes that need the database to be connected.
export function requireDB(req, res, next) {
  if (!isDbReady()) {
    return res.status(503).json({ error: 'Database is not available. Running in guest mode.' });
  }
  next();
}
