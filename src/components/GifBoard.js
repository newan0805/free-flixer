'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import PropTypes from 'prop-types';

// Giphy API key — set NEXT_PUBLIC_GIPHY_KEY in your .env file (fallback is Giphy public beta key)
const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_KEY;
const LIMIT = 24;

async function fetchGiphy(query, offset = 0) {
  const base = query.trim()
    ? 'https://api.giphy.com/v1/gifs/search'
    : 'https://api.giphy.com/v1/gifs/trending';
  const params = new URLSearchParams({
    api_key: GIPHY_KEY,
    limit: String(LIMIT),
    offset: String(offset),
    rating: 'pg-13',
    ...(query.trim() ? { q: query.trim() } : {}),
  });
  const res = await fetch(`${base}?${params}`);
  if (!res.ok) throw new Error('Giphy fetch failed');
  const json = await res.json();
  const sanitize = (url) => {
    try {
      const u = new URL(url ?? '');
      const isGiphyHost = u.protocol === 'https:'
        && (u.hostname === 'giphy.com' || u.hostname.endsWith('.giphy.com'));
      return isGiphyHost ? u.toString() : null;
    } catch {
      return null;
    }
  };
  return {
    gifs: json.data.map((g) => ({
      id: g.id,
      title: g.title,
      preview: sanitize(g.images?.fixed_height_small?.url || g.images?.fixed_height?.url),
      full: sanitize(g.images?.fixed_height?.url || g.images?.downsized?.url),
    })).filter((g) => g.preview && g.full),
    total: json.pagination?.total_count ?? 0,
  };
}

GifBoard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function GifBoard({ isOpen, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const load = useCallback(async (q, off) => {
    setLoading(true);
    setError('');
    try {
      const { gifs: newGifs, total: newTotal } = await fetchGiphy(q, off);
      setGifs((prev) => (off === 0 ? newGifs : [...prev, ...newGifs]));
      setTotal(newTotal);
      setOffset(off + newGifs.length);
    } catch {
      setError('Could not load GIFs. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending when opened
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setGifs([]);
    setOffset(0);
    setTotal(0);
    load('', 0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen, load]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setGifs([]);
      setOffset(0);
      load(query, 0);
    }, 380);
    return () => clearTimeout(debounceRef.current);
  }, [query, isOpen, load]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasMore = gifs.length < total;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Modal */}
      <dialog
        open
        aria-label="GIF picker"
        className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center bg-transparent border-0 m-0 p-0 sm:p-4 w-full max-w-none"
      >
      <div
        className="w-full sm:max-w-2xl bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <span className="font-bold text-white text-base">GIFs</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none transition"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-4 pt-3 pb-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Giphy..."
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-fuchsia-500 transition"
          />
          <p className="text-xs text-slate-500 mt-1 text-right">
            {query.trim() ? `${total.toLocaleString()} results` : 'Trending'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {error && (
            <p className="text-red-400 text-sm text-center py-6">{error}</p>
          )}
          {!error && gifs.length === 0 && !loading && (
            <p className="text-slate-400 text-sm text-center py-6">No GIFs found.</p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {gifs.map((g) => (
              <button
                key={g.id}
                onClick={() => { onSelect(g.full); onClose?.(); }}
                className="relative overflow-hidden rounded-lg aspect-square bg-slate-800 hover:ring-2 hover:ring-fuchsia-500 transition group"
                title={g.title}
              >
                <Image
                  src={g.preview}
                  alt={g.title}
                  fill
                  sizes="150px"
                  className="object-cover group-hover:scale-105 transition duration-200"
                  unoptimized
                />
              </button>
            ))}
          </div>

          <div className="flex justify-center mt-4">
            {loading && (
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-fuchsia-500" />
            )}
            {!loading && hasMore && (
              <button
                onClick={() => load(query, offset)}
                className="px-5 py-2 rounded-lg bg-fuchsia-700/40 border border-fuchsia-500/50 text-fuchsia-200 text-sm hover:bg-fuchsia-700/70 transition"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      </div>
      </dialog>
    </>
  );
}
