'use client';

import { useState, useEffect } from 'react';

export default function NicknameModal({ isOpen, onClose, onConfirm, watchUrl, title = 'Set Your Nickname' }) {
  const [nickname, setNickname] = useState(() => {
    if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
      return '';
    }

    return localStorage.getItem('watchTogetherNickname') || '';
  });
  const [loading, setLoading] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    if (nickname.trim()) {
      setLoading(true);
      localStorage.setItem('watchTogetherNickname', nickname);
      
      if (watchUrl) {
        // Generate the full shareable URL
        const origin = typeof globalThis !== 'undefined' && globalThis.location ? globalThis.location.origin : '';
        const encodedUrl = encodeURIComponent(watchUrl);
        const fullShareUrl = origin ? `${origin}/watch-together?watch=${encodedUrl}` : null;
        
        // Save the watch together link
        try {
          const links = JSON.parse(localStorage.getItem('watchTogetherInvites') || '[]');
          const entry = {
            url: watchUrl,
            nickname,
            savedAt: Date.now()
          };
          const filtered = links.filter(l => l.url !== watchUrl);
          filtered.unshift(entry);
          localStorage.setItem('watchTogetherInvites', JSON.stringify(filtered.slice(0, 50)));
          
          // Copy the full shareable URL to clipboard
          if (fullShareUrl) {
            await navigator.clipboard.writeText(fullShareUrl);
            alert(`Link copied! Share it to watch together with ${nickname}`);
          }
        } catch (err) {
          console.error('Failed to save link:', err);
        }
      }
      
      onConfirm?.();
      setLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter your nickname"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 mb-4 transition"
          autoFocus
          onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!nickname.trim() || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : watchUrl ? 'Save & Join' : 'Confirm'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
