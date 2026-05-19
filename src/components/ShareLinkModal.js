'use client';

import { useState, useEffect } from 'react';

export default function ShareLinkModal({ 
  isOpen, 
  onClose, 
  onOpenNicknameModal,
  watchUrl, 
  title = 'Share Watch Together Link' 
}) {
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && watchUrl) {
      // Generate the full shareable URL
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const encoded = encodeURIComponent(watchUrl);
      const fullUrl = `${origin}/watch-together?watch=${encoded}`;
      setShareLink(fullUrl);
      setCopied(false);
    }
  }, [isOpen, watchUrl]);

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    }
  };

  if (!isOpen || !shareLink) return null;

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
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-lg w-full p-6 animate-scale-in">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        
        <p className="text-slate-300 text-sm mb-4">
          Share this link with anyone to watch together in real-time!
        </p>

        {/* Shareable Link Box */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-4">
          <p className="text-xs text-slate-400 mb-2 font-semibold">Share Link</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm font-mono break-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded font-medium transition whitespace-nowrap ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code or Instructions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-300 mb-3">
            <strong>How to use:</strong>
          </p>
          <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
            <li>Copy the link above</li>
            <li>Paste it in your browser address bar or share with friends</li>
            <li>They'll be automatically taken to Watch Together with this content</li>
            <li>Set your nickname to start chatting!</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition font-medium"
          >
            Close
          </button>
          <button
            onClick={() => {
              onOpenNicknameModal?.();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
          >
            Save & Join
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          💡 Tip: You can also paste URLs directly on the Watch Together page
        </p>
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
