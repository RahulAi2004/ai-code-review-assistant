import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewResults from './ReviewResults';

const singleResult = {
  filename: 'app.js',
  review: {
    summary: 'Mostly solid with one security issue.',
    score: 72,
    language: 'javascript',
    issues: [
      {
        severity: 'high',
        category: 'security',
        line: 3,
        title: 'SQL injection risk',
        description: 'Query built by string concatenation.',
        suggestion: 'Use parameterised queries.',
      },
      {
        severity: 'low',
        category: 'style',
        line: null,
        title: 'Inconsistent naming',
        description: 'Mix of camelCase and snake_case.',
        suggestion: 'Pick one convention.',
      },
    ],
    strengths: ['Readable structure'],
  },
};

describe('ReviewResults', () => {
  it('renders nothing when there is no result', () => {
    const { container } = render(<ReviewResults result={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the summary, score and filename for a single review', () => {
    render(<ReviewResults result={singleResult} />);
    expect(screen.getByText(/Mostly solid/)).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText(/app\.js/)).toBeInTheDocument();
  });

  it('renders each issue with its title and suggested fix', () => {
    render(<ReviewResults result={singleResult} />);
    expect(screen.getByText('SQL injection risk')).toBeInTheDocument();
    expect(screen.getByText('Use parameterised queries.')).toBeInTheDocument();
    expect(screen.getByText('Inconsistent naming')).toBeInTheDocument();
  });

  it('shows the strengths section', () => {
    render(<ReviewResults result={singleResult} />);
    expect(screen.getByText('Readable structure')).toBeInTheDocument();
  });

  it('renders a "no issues" pill when a file is clean', () => {
    const clean = {
      filename: 'clean.js',
      review: { summary: 'Great.', score: 98, language: 'javascript', issues: [], strengths: [] },
    };
    render(<ReviewResults result={clean} />);
    expect(screen.getByText(/no issues found/i)).toBeInTheDocument();
  });

  it('renders multiple files for a GitHub result', () => {
    const githubResult = {
      source: { type: 'repo', owner: 'octocat', repo: 'demo' },
      fileCount: 1,
      reviews: [singleResult],
    };
    render(<ReviewResults result={githubResult} />);
    expect(screen.getByText(/octocat\/demo/)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed 1 file/)).toBeInTheDocument();
  });
});
