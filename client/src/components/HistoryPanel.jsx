import { useEffect, useState, useCallback } from 'react';
import { listReviews, getReview, deleteReview } from '../api';
import StatsPanel from './StatsPanel';

const SOURCE_ICON = { paste: '📝', upload: '📄', github: '🐙' };

function scoreColor(score) {
  if (score == null) return 'var(--muted)';
  const hue = Math.round((score / 100) * 120);
  return `hsl(${hue}, 70%, 55%)`;
}

// Shows the logged-in user's saved reviews. `onOpen` receives a full result
// object (same shape as a fresh review) so the parent can render it.
export default function HistoryPanel({ onOpen, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { reviews } = await listReviews();
      setItems(reviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function open(id) {
    try {
      const { review } = await getReview(id);
      onOpen({ filename: review.filename, review });
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(e, id) {
    e.stopPropagation();
    try {
      await deleteReview(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="history">
      <div className="history-head">
        <h3>Your history</h3>
        <button className="link-btn" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      {loading && <p className="history-muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="history-muted">No saved reviews yet. Run a review while signed in.</p>
      )}

      <StatsPanel items={items} />

      <ul className="history-list">
        {items.map((r) => (
          <li key={r.id} className="history-item" onClick={() => open(r.id)}>
            <span className="history-score" style={{ color: scoreColor(r.score) }}>
              {r.score ?? '—'}
            </span>
            <span className="history-main">
              <span className="history-file">
                {SOURCE_ICON[r.source] || '📝'} {r.filename || r.language || 'snippet'}
              </span>
              <span className="history-meta">
                {r.issueCount} issue{r.issueCount === 1 ? '' : 's'} ·{' '}
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </span>
            <button
              className="history-del"
              title="Delete"
              onClick={(e) => remove(e, r.id)}
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
