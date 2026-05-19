'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';

const CHAT_STORAGE_PREFIX = 'watchTogetherChat_';

function getChatStorageKey(roomId, watchUrl) {
  return `${CHAT_STORAGE_PREFIX}${roomId || watchUrl || 'default'}`;
}

function readChatHistory(storageKey) {
  if (!storageKey || globalThis.window === undefined) return [];

  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeChatHistory(storageKey, messages) {
  if (!storageKey || globalThis.window === undefined) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-200)));
  } catch {
    // Ignore storage quota / privacy mode failures.
  }
}

function isGifMessage(text) {
  return /\.(gif|png|jpg|jpeg)$/i.test(text) || text.includes('giphy.com') || text.includes('tenor.com');
}

function sanitizeChatText(text) {
  return String(text ?? '').replace(/[&<>"]|'/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function appendUniqueMessage(previousMessages, message, storageKey) {
  if (previousMessages.some((item) => item.id === message.id)) return previousMessages;

  const updated = [...previousMessages, message];
  writeChatHistory(storageKey, updated);
  return updated;
}

export default function WatchTogetherChatModal({ isOpen, onClose, roomId, watchUrl }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [gifInput, setGifInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const storageKey = useMemo(() => getChatStorageKey(roomId, watchUrl), [roomId, watchUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = globalThis.setTimeout(() => {
      setMessages(readChatHistory(storageKey));
    }, 0);

    return () => globalThis.clearTimeout(timer);
  }, [isOpen, storageKey]);

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

  useEffect(() => {
    if (!isOpen || !roomId) return;

    const nickname = localStorage.getItem('watchTogetherNickname') || 'Anonymous';

    // Connect to socket
    socketRef.current = io(undefined, {
      path: '/api/socket_io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', { roomId, nickname });
    });

    socketRef.current.on('new-message', (msg) => {
      setMessages((prev) => appendUniqueMessage(prev, msg, storageKey));
    });

    socketRef.current.on('system-message', (msg) => {
      const systemMessage = { ...msg, type: 'system' };

      setMessages((prev) => appendUniqueMessage(prev, systemMessage, storageKey));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, roomId, storageKey]);

  const isValidGifUrl = (url) => {
    return url.match(/\.(gif|png|jpg|jpeg)$/i) || 
           url.includes('giphy.com') || 
           url.includes('tenor.com');
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || !socketRef.current) return;

    const nickname = localStorage.getItem('watchTogetherNickname') || 'Anonymous';
    const safeNickname = sanitizeChatText(nickname);

    socketRef.current.emit('send-message', {
      roomId,
      message: {
        text,
        nickname: safeNickname,
        type: 'text',
      },
    });
    setInputText('');
  };

  const handleSendGif = () => {
    const gif = gifInput.trim();
    if (!gif) return;

    if (!isValidGifUrl(gif)) {
      alert('Please enter a valid GIF URL (Giphy, Tenor, or direct .gif link)');
      return;
    }

    const nickname = localStorage.getItem('watchTogetherNickname') || 'Anonymous';
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        roomId,
        message: {
          text: gif,
          nickname,
          type: 'gif',
        },
      });
      setGifInput('');
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleMessageKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleGifKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendGif();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4 animate-fade-in">
      <button
        type="button"
        aria-label="Close chat dialog"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={handleBackdropClick}
      />
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full md:max-w-md h-[90vh] md:h-[70vh] flex flex-col animate-slide-up md:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Watch Together Chat</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl hover:scale-110 transform"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No messages yet. Say something!
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id || `${msg.createdAt}-${msg.nickname}-${msg.text}`} className={msg.type === 'system' ? 'text-center' : ''}>
                {msg.type === 'system' ? (
                  <p className="text-slate-500 text-sm italic">{String(msg.text ?? '')}</p>
                ) : (
                  <div>
                    <p className="text-blue-400 text-sm font-semibold">{String(msg.nickname ?? '')}</p>
                    {isGifMessage(msg.text) ? (
                      <p className="text-white wrap-break-word">GIF shared: {String(msg.text ?? '')}</p>
                    ) : (
                      <p className="text-white wrap-break-word">{String(msg.text ?? '')}</p>
                    )}
                    {(() => {
                      const createdAt = Number.isFinite(Number(msg.createdAt))
                        ? Number(msg.createdAt)
                        : Date.now();

                      return (
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(createdAt).toLocaleTimeString()}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700 p-4 space-y-3">
          {/* Text Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleMessageKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {/* GIF Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={gifInput}
              onChange={(e) => setGifInput(e.target.value)}
              onKeyDown={handleGifKeyDown}
              placeholder="Paste GIF URL..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSendGif}
              disabled={!gifInput.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
            >
              🎬 GIF
            </button>
          </div>
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

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

const noopPropType = () => null;

WatchTogetherChatModal.propTypes = {
  isOpen: noopPropType,
  onClose: noopPropType,
  roomId: noopPropType,
  watchUrl: noopPropType,
};
