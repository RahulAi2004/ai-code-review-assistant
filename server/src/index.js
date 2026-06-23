import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './db.js';

const PORT = process.env.PORT || 5000;
const app = createApp();

// Connect to the database, but don't block startup on it: if it fails the
// core review feature still works in guest mode (auth/history disabled).
connectDB().catch((err) => {
  console.error('[db] connection failed — running in guest mode:', err.message);
});

app.listen(PORT, () => {
  console.log(`AI Code Review API running on http://localhost:${PORT}`);
});
