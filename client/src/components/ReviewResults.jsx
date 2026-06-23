// Renders the structured review(s) returned by the API.
import { useState } from 'react';
import { downloadMarkdown, copyToClipboard } from '../utils/exportReview';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

function ScoreRing({ score }) {
  if (score == null) return null;
  const hue = Math.round((score / 100) * 120); // 0=red -> 120=green
  return (
    <div className="score-ring" style={{ '--hue': hue }}>
      <span className="score-value">{score}</span>
      <span className="score-label">/ 100</span>
    </div>
  );
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }
  return (
    <button className="copy-btn" onClick={onCopy} type="button">
      {copied ? '✓ Copied' : label}
    </button>
  );
}

function IssueCard({ issue }) {
  return (
    <div className={`issue issue--${issue.severity}`}>
      <div className="issue-head">
        <span className={`badge badge--${issue.severity}`}>{issue.severity}</span>
        <span className="badge badge--cat">{issue.category}</span>
        {issue.line != null && <span className="issue-line">line {issue.line}</span>}
        <span className="issue-title">{issue.title}</span>
      </div>
      {issue.description && <p className="issue-desc">{issue.description}</p>}
      {issue.suggestion && (
        <div className="issue-fix">
          <div className="issue-fix-top">
            <span className="issue-fix-label">Suggested fix</span>
            <CopyButton text={issue.suggestion} />
          </div>
          <pre>{issue.suggestion}</pre>
        </div>
      )}
    </div>
  );
}

function SingleReview({ filename, review }) {
  const issues = [...(review.issues || [])].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  const counts = SEVERITY_ORDER.map((sev) => ({
    sev,
    n: issues.filter((i) => i.severity === sev).length,
  })).filter((c) => c.n > 0);

  return (
    <div className="review-card">
      <div className="review-top">
        <div>
          {filename && <div className="review-file">📄 {filename}</div>}
          <div className="review-lang">{review.language}</div>
          <p className="review-summary">{review.summary}</p>
          <div className="count-pills">
            {counts.length === 0 && <span className="pill pill--clean">No issues found</span>}
            {counts.map((c) => (
              <span key={c.sev} className={`pill pill--${c.sev}`}>
                {c.n} {c.sev}
              </span>
            ))}
          </div>
        </div>
        <ScoreRing score={review.score} />
      </div>

      {review.strengths?.length > 0 && (
        <div className="strengths">
          <h4>✅ Strengths</h4>
          <ul>
            {review.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {issues.length > 0 && (
        <div className="issues">
          <h4>🔍 Issues ({issues.length})</h4>
          {issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewResults({ result }) {
  if (!result) return null;

  const isGithub = Array.isArray(result.reviews);

  return (
    <div className="results">
      <div className="results-toolbar">
        <span className="results-label">
          {isGithub
            ? `Reviewed ${result.fileCount} file${result.fileCount === 1 ? '' : 's'} from `
            : 'Review complete'}
          {isGithub && (
            <strong>
              {result.source.owner}/{result.source.repo}
            </strong>
          )}
        </span>
        <button className="export-btn" onClick={() => downloadMarkdown(result)} type="button">
          ⬇ Export .md
        </button>
      </div>

      {isGithub
        ? result.reviews.map((r, i) =>
            r.error ? (
              <div key={i} className="review-card review-card--error">
                <div className="review-file">📄 {r.filename}</div>
                <p className="error-text">{r.error}</p>
              </div>
            ) : (
              <SingleReview key={i} filename={r.filename} review={r.review} />
            )
          )
        : <SingleReview filename={result.filename} review={result.review} />}
    </div>
  );
}
