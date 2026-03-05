'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalculationRecord } from '@/types';

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const AVATARS = [
  'from-pink-400 to-rose-500',
  'from-violet-400 to-purple-500',
  'from-blue-400 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
];

const NAMES = ['Alex', 'Sam', 'Jordan', 'Riley', 'Morgan'];

function getAvatarForId(id: number) {
  return AVATARS[id % AVATARS.length];
}
function getNameForId(id: number) {
  return NAMES[id % NAMES.length];
}

interface HistoryCardProps {
  calc: CalculationRecord;
  onLike: (id: number) => void;
  onShare: (id: number) => void;
  liked: boolean;
}

function HistoryCard({ calc, onLike, onShare, liked }: HistoryCardProps) {
  const avatarGradient = getAvatarForId(calc.id);
  const name = getNameForId(calc.id);

  return (
    <div className="feed-card">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
        >
          <span className="text-white text-sm font-bold">{name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 text-sm">{name}</span>
              <span className="text-slate-400 text-xs ml-2">calculated</span>
            </div>
            <span className="text-slate-400 text-xs flex-shrink-0">
              {timeAgo(calc.createdAt)}
            </span>
          </div>

          <div className="mt-2 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-3 border border-slate-100">
            <div className="text-slate-500 text-xs font-mono mb-1 truncate">
              {calc.expression}
            </div>
            <div className="text-slate-900 font-bold font-mono text-lg">
              = {calc.result}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => onLike(calc.id)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-150 ${
                liked
                  ? 'text-rose-500'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{calc.likes}</span>
            </button>

            <button
              onClick={() => onShare(calc.id)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-150 ${
                calc.shared
                  ? 'text-brand-500'
                  : 'text-slate-400 hover:text-brand-400'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>{calc.shared ? 'Shared' : 'Share'}</span>
            </button>

            <div className="ml-auto">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  calc.shared
                    ? 'bg-brand-50 text-brand-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {calc.shared ? '🌐 Public' : '🔒 Private'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalculationHistoryProps {
  refreshTrigger: number;
}

export default function CalculationHistory({
  refreshTrigger,
}: CalculationHistoryProps) {
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/calculations');
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
      } else {
        setError('Failed to load history');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const handleLike = async (id: number) => {
    const isLiked = likedIds.has(id);
    const action = isLiked ? 'unlike' : 'like';

    setHistory((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, likes: isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      await fetch('/api/calculations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
    } catch {
      // revert
      setHistory((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, likes: isLiked ? c.likes + 1 : c.likes - 1 }
            : c
        )
      );
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const handleShare = async (id: number) => {
    const calc = history.find((c) => c.id === id);
    if (calc?.shared) return;

    setHistory((prev) =>
      prev.map((c) => (c.id === id ? { ...c, shared: true } : c))
    );

    try {
      await fetch('/api/calculations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'share' }),
      });
    } catch {
      setHistory((prev) =>
        prev.map((c) => (c.id === id ? { ...c, shared: false } : c))
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="font-bold text-slate-700 text-base">Calculation Feed</h2>
        </div>
        <button
          onClick={fetchHistory}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-12 bg-slate-100 rounded-xl" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <div className="text-rose-400 text-sm">{error}</div>
            <button
              onClick={fetchHistory}
              className="mt-2 text-brand-600 text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">No calculations yet</p>
            <p className="text-slate-400 text-xs mt-1">Start calculating to see your feed!</p>
          </div>
        )}

        {!loading &&
          !error &&
          history.map((calc) => (
            <HistoryCard
              key={calc.id}
              calc={calc}
              onLike={handleLike}
              onShare={handleShare}
              liked={likedIds.has(calc.id)}
            />
          ))}
      </div>
    </div>
  );
}
