import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildReviewPrompt } from '../prompts/reviewPrompt.js';

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!apiKey) {
  console.warn(
    '[gemini] GEMINI_API_KEY is not set. Copy server/.env.example to server/.env and add your key.'
  );
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Pull the first {...} JSON object out of a model response, tolerating any
// stray markdown fences or prose the model might wrap around it.
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in model response');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

// Normalise the model output so the frontend always gets a predictable shape.
export function normaliseReview(raw, fallbackLanguage) {
  const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
  return {
    summary: raw.summary || 'No summary returned.',
    score: typeof raw.score === 'number' ? Math.round(raw.score) : null,
    language: raw.language || fallbackLanguage || 'unknown',
    issues: Array.isArray(raw.issues)
      ? raw.issues.map((i) => ({
          severity: validSeverities.includes(i.severity) ? i.severity : 'info',
          category: i.category || 'best-practice',
          line: Number.isInteger(i.line) ? i.line : null,
          title: i.title || 'Issue',
          description: i.description || '',
          suggestion: i.suggestion || '',
        }))
      : [],
    strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
  };
}

/**
 * Run an AI code review on a single piece of code.
 * @returns {Promise<object>} normalised review object
 */
export async function reviewCode({ code, language = 'auto', filename = '' }) {
  if (!genAI) {
    throw new Error('Gemini API key is not configured on the server.');
  }
  if (!code || !code.trim()) {
    throw new Error('No code provided to review.');
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
  });

  const prompt = buildReviewPrompt({ code, language, filename });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    parsed = extractJson(text);
  } catch (err) {
    throw new Error(`Failed to parse AI response: ${err.message}`);
  }

  return normaliseReview(parsed, language);
}
