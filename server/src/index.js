import 'dotenv/config';
import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`AI Code Review API running on http://localhost:${PORT}`);
});
