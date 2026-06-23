import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { reviewSnippet, reviewGithub } from './api';
import { useAuth } from './auth/AuthContext';
import ReviewResults from './components/ReviewResults';
import AuthModal from './components/AuthModal';
import HistoryPanel from './components/HistoryPanel';
import './App.css';

const LANGUAGES = [
  'auto', 'javascript', 'typescript', 'python', 'java', 'go', 'rust',
  'c', 'cpp', 'csharp', 'php', 'ruby', 'sql', 'html', 'css',
];

// Map our language values to Monaco's language ids.
const MONACO_LANG = { auto: 'plaintext', cpp: 'cpp', csharp: 'csharp' };

const SAMPLE = `function getUser(id) {
  // No input validation, builds SQL by string concatenation
  const query = "SELECT * FROM users WHERE id = " + id;
  db.execute(query, function(err, rows) {
    return rows[0];
  });
}`;

export default function App() {
  const { user, logout } = useAuth();

  const [tab, setTab] = useState('paste'); // paste | upload | github
  const [code, setCode] = useState(SAMPLE);
  const [language, setLanguage] = useState('auto');
  const [filename, setFilename] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [historyKey, setHistoryKey] = useState(0); // bump to refresh history

  // Theme (light / dark), persisted in localStorage.
  const [theme, setTheme] = useState(() => localStorage.getItem('acr_theme') || 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('acr_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCode(String(reader.result || ''));
      setTab('paste'); // show the loaded code in the editor
    };
    reader.readAsText(file);
  }

  async function runReview() {
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    try {
      const data =
        tab === 'github'
          ? await reviewGithub(githubUrl)
          : await reviewSnippet({
              code,
              language,
              filename,
              source: tab === 'upload' || filename ? 'upload' : 'paste',
            });
      setResult(data);

      // Did the backend save it to history?
      const wasSaved = Array.isArray(data.reviews)
        ? data.reviews.some((r) => r.savedId)
        : Boolean(data.savedId);
      if (wasSaved) {
        setSaved(true);
        setHistoryKey((k) => k + 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const canRun = tab === 'github' ? githubUrl.trim().length > 0 : code.trim().length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">⟨/⟩</span>
          <div>
            <h1>AI Code Review Assistant</h1>
            <p>Paste, upload, or link a GitHub repo — get an instant AI review.</p>
          </div>
        </div>
        <div className="header-right">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="powered">Powered by Gemini</span>
          {user ? (
            <div className="user-box">
              <span className="user-name">👤 {user.name}</span>
              <button className="ghost-btn" onClick={logout}>
                Log out
              </button>
            </div>
          ) : (
            <button className="ghost-btn" onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="layout">
        <section className="panel input-panel">
          <div className="tabs">
            <button className={tab === 'paste' ? 'active' : ''} onClick={() => setTab('paste')}>
              Paste code
            </button>
            <button className={tab === 'upload' ? 'active' : ''} onClick={() => setTab('upload')}>
              Upload file
            </button>
            <button className={tab === 'github' ? 'active' : ''} onClick={() => setTab('github')}>
              GitHub URL
            </button>
          </div>

          {tab === 'paste' && (
            <>
              <div className="controls">
                <label>
                  Language
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="editor-wrap">
                <Editor
                  height="100%"
                  theme={theme === 'light' ? 'light' : 'vs-dark'}
                  language={MONACO_LANG[language] || language}
                  value={code}
                  onChange={(v) => setCode(v ?? '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </>
          )}

          {tab === 'upload' && (
            <div className="upload-zone">
              <input id="file" type="file" onChange={handleFile} />
              <label htmlFor="file" className="upload-label">
                <span className="upload-icon">⬆</span>
                <span>Choose a source file</span>
                <small>.js .ts .py .java .go .cpp .cs … — it loads into the editor</small>
              </label>
              {filename && <p className="upload-name">Loaded: {filename}</p>}
            </div>
          )}

          {tab === 'github' && (
            <div className="github-zone">
              <label>
                GitHub repo, pull request, or file URL
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo  ·  /pull/12  ·  /blob/main/app.js"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </label>
              <p className="hint">
                Fetches up to 10 source files (a PR reviews only its changed files) and reviews each.
              </p>
            </div>
          )}

          <button className="run-btn" disabled={!canRun || loading} onClick={runReview}>
            {loading ? 'Reviewing…' : 'Review code'}
          </button>
          {error && <p className="error-text">{error}</p>}
          {!user && (
            <p className="save-hint">
              💡{' '}
              <button className="link-btn" onClick={() => setShowAuth(true)}>
                Sign in
              </button>{' '}
              to save your reviews to history.
            </p>
          )}

          {user && <HistoryPanel onOpen={setResult} refreshKey={historyKey} />}
        </section>

        <section className="panel output-panel">
          {!result && !loading && (
            <div className="empty">
              <p className="empty-emoji">🔬</p>
              <p>Your AI review will appear here.</p>
            </div>
          )}
          {loading && (
            <div className="empty">
              <div className="spinner" />
              <p>Analyzing your code…</p>
            </div>
          )}
          {saved && result && <div className="saved-banner">✓ Saved to your history</div>}
          <ReviewResults result={result} />
        </section>
      </main>

      <footer className="app-footer">
        Software Engineering Individual Project · AI Code Review Assistant
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
