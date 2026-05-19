'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function WatchTogetherChatModal({ isOpen, onClose, roomId, watchUrl }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [gifInput, setGifInput] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('system-message', (msg) => {
      setMessages((prev) => [...prev, { ...msg, type: 'system' }]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, roomId]);

  const isValidGifUrl = (url) => {
    return url.match(/\.(gif|png|jpg|jpeg)$/i) || 
           url.includes('giphy.com') || 
           url.includes('tenor.com');
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || !socketRef.current) return;

    const nickname = localStorage.getItem('watchTogetherNickname') || 'Anonymous';
    socketRef.current.emit('send-message', {
      roomId,
      message: {
        text,
        nickname,
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

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
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
            messages.map((msg, idx) => (
              <div key={idx} className={msg.type === 'system' ? 'text-center' : ''}>
                {msg.type === 'system' ? (
                  <p className="text-slate-500 text-sm italic">{msg.text}</p>
                ) : (
                  <div>
                    <p className="text-blue-400 text-sm font-semibold">{msg.nickname}</p>
                    {msg.text.match(/\.(gif|png|jpg|jpeg)$/i) || 
                     msg.text.includes('giphy.com') || 
                     msg.text.includes('tenor.com') ? (
                      <img
                        src={msg.text}
                        alt="GIF"
                        className="max-w-full max-h-48 rounded mt-1"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <p className="text-white break-words">{msg.text}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || loading}
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendGif()}
              placeholder="Paste GIF URL..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSendGif}
              disabled={!gifInput.trim() || loading}
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
