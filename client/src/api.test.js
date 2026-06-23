import { describe, it, expect, vi, afterEach } from 'vitest';
import { reviewSnippet, reviewGithub } from './api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api client', () => {
  it('reviewSnippet POSTs to /api/review and returns the parsed body', async () => {
    const body = { filename: 'a.js', review: { summary: 'ok' } };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await reviewSnippet({ code: 'x', language: 'auto', filename: 'a.js' });

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/review',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('reviewGithub POSTs to /api/review/github', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reviews: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    await reviewGithub('https://github.com/o/r');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/review/github',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws with the server error message on a non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Field "code" is required.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(reviewSnippet({ code: '' })).rejects.toThrow(/code/i);
  });
});
