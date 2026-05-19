"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GifBoard from "@components/GifBoard";
import NicknameModal from "@components/NicknameModal";
import RoomPlayer, { parseWatchPath } from "@components/RoomPlayer";

const INVITES_KEY = "watchTogetherInvites";
const NICKNAME_KEY = "watchTogetherNickname";
const CHAT_KEY_PREFIX = "watchTogetherChat_";

function normalizeInviteUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.pathname.startsWith("/watch/")) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function getRoomFromInvite(invite) {
  try {
    const parsed = new URL(invite);
    return parsed.searchParams.get("sid") || parsed.searchParams.get("room") || "";
  } catch {
    return "";
  }
}

function deriveRoomFromUrl(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash * 31 + url.codePointAt(i)) >>> 0;
  }
  return `room-${hash}`;
}

function sanitizeGifUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const isAllowedHost = parsed.protocol === "https:"
      && (parsed.hostname === "giphy.com" || parsed.hostname.endsWith(".giphy.com"));
    return isAllowedHost ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export default function WatchTogetherPage() {
  const [nickname, setNickname] = useState("");
  const [savedInvites, setSavedInvites] = useState([]);
  const [inviteInput, setInviteInput] = useState("");
  const [currentInvite, setCurrentInvite] = useState("");
  const [roomId, setRoomId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showGifBoard, setShowGifBoard] = useState(false);
  const [roomUrlCopied, setRoomUrlCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const [activeSocket, setActiveSocket] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  // Refs so socket handlers always read fresh values without triggering reconnects
  const nickRef = useRef(nickname);
  const roomIdRef = useRef(roomId);
  useEffect(() => { nickRef.current = nickname; }, [nickname]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const canJoinRoom = Boolean(currentInvite && roomId && nickname.trim());

  const canUseRealtimeSocket = useCallback(async () => {
    try {
      const response = await fetch("/api/socket_io/?EIO=4&transport=polling", {
        method: "GET",
        cache: "no-store",
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const activeWatchPath = useMemo(() => {
    if (!currentInvite) return "";
    const info = parseWatchPath(currentInvite);
    if (!info) return "";
    let path = `/watch/${info.type}/${info.tmdbId}`;
    if (info.type === "tv") path += `?season=${info.season}&episode=${info.episode}`;
    return path;
  }, [currentInvite]);

  const loadChatHistory = useCallback((room) => {
    if (!room) return [];
    try {
      const raw = localStorage.getItem(`${CHAT_KEY_PREFIX}${room}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const saveChatMessage = useCallback((room, msg) => {
    if (!room) return;
    try {
      const raw = localStorage.getItem(`${CHAT_KEY_PREFIX}${room}`);
      const history = raw ? JSON.parse(raw) : [];
      const updated = [...history, msg].slice(-200); // keep last 200 messages
      localStorage.setItem(`${CHAT_KEY_PREFIX}${room}`, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, []);

  const appendUniqueMessage = useCallback((previousMessages, nextMessage) => {
    if (previousMessages.some((message) => message.id === nextMessage.id)) {
      return previousMessages;
    }

    return [...previousMessages, nextMessage];
  }, []);

  const loadSavedInvites = useCallback(() => {
    try {
      const raw = localStorage.getItem(INVITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedInvites(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedInvites([]);
    }
  }, []);

  const persistInvite = useCallback((inviteUrl, roomOverride = "") => {
    const normalized = normalizeInviteUrl(inviteUrl);
    if (!normalized) return null;

    const room = roomOverride || getRoomFromInvite(normalized) || deriveRoomFromUrl(normalized);
    const entry = {
      id: room,
      roomId: room,
      url: normalized,
      savedAt: Date.now(),
    };

    try {
      const raw = localStorage.getItem(INVITES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const deduped = list.filter((item) => item.url !== entry.url);
      const updated = [entry, ...deduped].slice(0, 60);
      localStorage.setItem(INVITES_KEY, JSON.stringify(updated));
      setSavedInvites(updated);
      return entry;
    } catch {
      return null;
    }
  }, []);

  const deleteInvite = useCallback((inviteId) => {
    try {
      const raw = localStorage.getItem(INVITES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const updated = list.filter((item) => item.id !== inviteId);
      localStorage.setItem(INVITES_KEY, JSON.stringify(updated));
      setSavedInvites(updated);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const storedName = localStorage.getItem(NICKNAME_KEY) || "";
    setNickname(storedName);
    // Auto-prompt for nickname if not set
    if (!storedName) {
      setShowNicknameModal(true);
    }
    loadSavedInvites();

    const url = new URL(globalThis.location.href);
    const watchParam = url.searchParams.get("watch");
    const roomParam = url.searchParams.get("room") || "";

    if (watchParam) {
      // watchParam may be: encoded relative path, encoded full URL, or raw path
      const resolveParam = (input) => {
        try {
          const p = new URL(input);
          if (p.pathname === '/watch-together') {
            const w = p.searchParams.get('watch');
            return w ? resolveParam(w) : null;
          }
          return p.pathname.startsWith('/watch/') ? p.pathname + p.search : null;
        } catch { /* not an absolute URL */ }
        try {
          const p = new URL(input, globalThis.location.origin);
          if (p.pathname === '/watch-together') {
            const w = p.searchParams.get('watch');
            return w ? resolveParam(w) : null;
          }
          return p.pathname.startsWith('/watch/') ? p.pathname + p.search : null;
        } catch { return null; }
      };

      const watchPath = resolveParam(decodeURIComponent(watchParam));
      if (watchPath) {
        const fullWatchUrl = `${globalThis.location.origin}${watchPath}`;
        const savedEntry = persistInvite(fullWatchUrl, roomParam);
        if (savedEntry) {
          setCurrentInvite(savedEntry.url);
          setInviteInput(savedEntry.url);
          setRoomId(savedEntry.roomId);
          setMessages(loadChatHistory(savedEntry.roomId));
        }
      }
    }
  }, [loadSavedInvites, persistInvite, isClient, loadChatHistory]);

  useEffect(() => {
    if (!canJoinRoom) return;

    let isMounted = true;

    const startSocket = async () => {
      const hasSocketEndpoint = await canUseRealtimeSocket();
      if (!isMounted || !hasSocketEndpoint) {
        setIsConnected(false);
        setActiveSocket(null);
        return;
      }

      await fetch("/api/socket");
      if (!isMounted) return;

      const { io } = await import("socket.io-client");
      const socket = io({ path: "/api/socket_io" });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (!isMounted) return;
        setIsConnected(true);
        setActiveSocket(socket);
        socket.emit("join-room", { roomId: roomIdRef.current, nickname: nickRef.current });
      });

      socket.on("disconnect", () => {
        if (!isMounted) return;
        setIsConnected(false);
      });

      // Server echoes the message to everyone in the room (including sender).
      // We rely on this echo as the single source of truth — no local pre-save.
      socket.on("new-message", (payload) => {
        if (!isMounted) return;
        const nextMessages = appendUniqueMessage(messagesRef.current, payload);
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        saveChatMessage(roomIdRef.current, payload);
      });

      socket.on("system-message", (payload) => {
        if (!isMounted) return;
        const msg = { ...payload, type: "system", nickname: "System" };
        const nextMessages = appendUniqueMessage(messagesRef.current, msg);
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        saveChatMessage(roomIdRef.current, msg);
      });
    };

    startSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
      setActiveSocket(null);
      setIsConnected(false);
    };
  // Only reconnect when the room changes or canJoinRoom flips.
  // nickname/roomId are read via refs so they don't trigger reconnects.
  }, [appendUniqueMessage, canJoinRoom, canUseRealtimeSocket, currentInvite, saveChatMessage]);

  useEffect(() => {
    if (!isConnected || !canJoinRoom || !socketRef.current) return;
    socketRef.current.emit("join-room", {
      roomId,
      nickname: nickname.trim(),
    });
  }, [isConnected, canJoinRoom, roomId, nickname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNicknameConfirm = () => {
    const storedName = localStorage.getItem(NICKNAME_KEY) || "";
    setNickname(storedName);
    setShowNicknameModal(false);
  };

  const getRoomShareUrl = useCallback(() => {
    if (!currentInvite || !roomId) return '';
    const origin = globalThis.location?.origin ?? '';
    return `${origin}/watch-together?watch=${encodeURIComponent(currentInvite)}&room=${encodeURIComponent(roomId)}`;
  }, [currentInvite, roomId]);

  const handleCopyRoomUrl = async () => {
    const shareUrl = getRoomShareUrl();
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setRoomUrlCopied(true);
      setTimeout(() => setRoomUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy URL');
    }
  };

  const handleShareRoom = async () => {
    const shareUrl = getRoomShareUrl();
    if (!shareUrl) return;

    // Try to use native share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Watch Together',
          text: `Join me in watching! Room: ${roomId}`,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyRoomUrl();
    }
  };

  const handleSaveInvite = () => {
    let rawInput = inviteInput.trim();
    if (!rawInput) return;

    // Resolve a raw string to a /watch/... pathname, handling all formats:
    // 1. http://host/watch-together?watch=http%3A%2F%2Fhost%2Fwatch%2F...  (double-encoded full URL)
    // 2. http://host/watch-together?watch=%2Fwatch%2F...                   (encoded relative path)
    // 3. http://host/watch/movie/123                                        (direct full URL)
    // 4. /watch/movie/123                                                   (relative path)
    // 5. /watch-together?watch=%2Fwatch%2F...                              (relative share URL)
    const resolveWatchPath = (input) => {
      // Try as absolute URL
      try {
        const parsed = new URL(input);
        if (parsed.pathname === '/watch-together') {
          // Extract and recursively resolve the watch param
          const w = parsed.searchParams.get('watch');
          if (w) return resolveWatchPath(w);
        } else if (parsed.pathname.startsWith('/watch/')) {
          return parsed.pathname + parsed.search;
        }
        return null;
      } catch { /* not a valid absolute URL */ }

      // Try as relative URL using current origin
      try {
        const parsed = new URL(input, globalThis.location.origin);
        if (parsed.pathname === '/watch-together') {
          const w = parsed.searchParams.get('watch');
          if (w) return resolveWatchPath(w);
        } else if (parsed.pathname.startsWith('/watch/')) {
          return parsed.pathname + parsed.search;
        }
      } catch { /* ignore */ }

      return null;
    };

    const watchPath = resolveWatchPath(rawInput);

    if (!watchPath) {
      alert('Please paste a valid watch link (e.g. /watch/movie/123 or the full share URL).');
      return;
    }

    const fullWatchUrl = `${globalThis.location.origin}${watchPath}`;

    const savedEntry = persistInvite(fullWatchUrl);
    if (savedEntry) {
      setCurrentInvite(savedEntry.url);
      setRoomId(savedEntry.roomId);
      setMessages(loadChatHistory(savedEntry.roomId));
      setInviteInput('');
      if (!nickname.trim()) {
        setShowNicknameModal(true);
      }
    }
  };

  const handleSendText = () => {
    const text = chatInput.trim();
    if (!text || !socketRef.current || !isConnected) return;
    // Server broadcasts back to everyone including sender via "new-message",
    // so we don't add/save locally here — the echo is the source of truth.
    
    socketRef.current.emit("send-message", {
      roomId: roomIdRef.current,
      message: { text, nickname: nickRef.current, type: "text" },
    });
    setChatInput("");
  };

  const handleSendGif = useCallback((gifUrl) => {
    const safeGifUrl = sanitizeGifUrl(gifUrl);
    if (!safeGifUrl || !socketRef.current || !isConnected) return;
    socketRef.current.emit("send-message", {
      roomId: roomIdRef.current,
      message: { text: safeGifUrl, nickname: nickRef.current, type: "gif" },
    });
    setShowGifBoard(false);
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-slate-950 to-black text-white">
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 backdrop-blur-md">
          <h1 className="text-2xl md:text-3xl font-bold">Watch Together</h1>
          <p className="text-sm text-slate-300 mt-2">
            Share a watch link, set your nickname, and chat in realtime with your partner.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <h2 className="font-semibold mb-3">Your Nickname</h2>
              <div className="flex flex-col gap-3">
                {nickname ? (
                  <div className="rounded-lg bg-black/50 border border-cyan-400/50 px-3 py-2 text-sm">
                    <p className="text-xs text-slate-300 mb-1">Watching as:</p>
                    <p className="text-cyan-300 font-medium">{nickname}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No nickname set — required to join a room.</p>
                )}
                <button
                  onClick={() => setShowNicknameModal(true)}
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium w-full"
                >
                  {nickname ? 'Change Nickname' : 'Set Nickname'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <h2 className="font-semibold mb-3">Paste Watch Link</h2>
              <p className="text-xs text-slate-400 mb-3">
                Paste a complete watch-together URL or a direct watch link below
              </p>
              <textarea
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                rows={3}
                placeholder="e.g., https://yoursite.com/watch-together?watch=/watch/movie/123&#10;or&#10;/watch/tv/456?season=1&episode=5"
                className="w-full rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={handleSaveInvite}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium w-full"
                >
                  Add & Join
                </button>
                <p className="text-xs text-slate-500">
                  ✓ URL saved to local storage
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <h2 className="font-semibold mb-3">Saved Invite Links</h2>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {savedInvites.length === 0 ? (
                  <p className="text-sm text-slate-400">No saved links yet.</p>
                ) : (
                  savedInvites.map((item) => (
                    <div
                      key={`${item.id}-${item.savedAt}`}
                      className="flex items-stretch gap-1 rounded-lg border border-white/10 bg-black/40 hover:bg-black/50 transition-colors overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setCurrentInvite(item.url);
                          setInviteInput(item.url);
                          const room = item.roomId || getRoomFromInvite(item.url);
                          setRoomId(room);
                          setMessages(loadChatHistory(room));
                        }}
                        className="flex-1 text-left px-3 py-2"
                      >
                        <p className="text-sm font-medium truncate">Room: {item.roomId || "Unknown"}</p>
                        <p className="text-xs text-slate-300 truncate">{item.url}</p>
                      </button>
                      <button
                        onClick={() => deleteInvite(item.id)}
                        title="Remove this invite"
                        className="px-3 text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 backdrop-blur-md flex flex-col min-h-[70vh]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/10 pb-4 mb-4">
              <div className="flex-1">
                <p className="text-sm text-slate-300">Room ID</p>
                <p className="font-semibold break-all">{roomId || "Not joined"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${isConnected ? "bg-green-600/40 text-green-200" : "bg-red-600/40 text-red-200"}`}>
                  {isConnected ? "🟢 Connected" : "🔴 Offline"}
                </span>
              </div>
            </div>

            {/* Share Room Section */}
            {isClient && currentInvite && roomId && (
              <div className="rounded-lg border border-white/10 bg-black/40 p-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Share this room:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={getRoomShareUrl()}
                        readOnly
                        className="flex-1 bg-slate-900/70 border border-white/10 rounded px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none cursor-pointer"
                        onClick={(e) => e.target.select()}
                      />
                      <button
                        onClick={handleCopyRoomUrl}
                        title="Copy room URL"
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition flex items-center gap-1"
                      >
                        {roomUrlCopied ? (
                          <>
                            <span>✓</span>
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </button>
                      {typeof navigator !== 'undefined' && navigator.share && (
                        <button
                          onClick={handleShareRoom}
                          title="Share room"
                          className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white transition flex items-center gap-1"
                        >
                          <span>🔗</span>
                          <span className="text-xs">Share</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeWatchPath ? (
              <div className="mb-4">
                <RoomPlayer
                  watchUrl={activeWatchPath}
                  title={activeWatchPath}
                  socket={activeSocket}
                  roomId={roomId}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 bg-black/30 p-6 text-sm text-slate-300 mb-4">
                Paste and add a watch invite URL to load the player.
              </div>
            )}

            <div className="flex-1 rounded-xl border border-white/10 bg-black/40 p-3 overflow-y-auto space-y-2 min-h-30 max-h-72">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-400">No messages yet.</p>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isOwn = msg.nickname === nickname;
                    const isSystem = msg.type === "system";
                    const safeGifUrl = msg.type === "gif" ? sanitizeGifUrl(msg.text) : "";
                    if (isSystem) {
                      return (
                        <div key={msg.id ?? i} className="text-center">
                          <span className="text-xs text-slate-500 bg-slate-800/60 rounded-full px-3 py-1">{msg.text}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id ?? i} className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                        <span className={`text-xs font-medium ${isOwn ? "text-cyan-400" : "text-fuchsia-400"}`}>
                          {isOwn ? "You" : (msg.nickname || "Guest")}
                        </span>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                          isOwn
                            ? "bg-cyan-600/30 border border-cyan-500/30 text-white rounded-br-sm"
                            : "bg-slate-700/60 border border-white/10 text-slate-100 rounded-bl-sm"
                        }`}>
                          {safeGifUrl ? (
                            <div className="relative w-48 max-w-full overflow-hidden rounded-lg">
                              <Image
                                src={safeGifUrl}
                                alt="Shared GIF"
                                width={192}
                                height={192}
                                unoptimized
                                className="h-auto w-full rounded-lg"
                              />
                            </div>
                          ) : (
                            <p className="text-sm wrap-break-word leading-snug">{msg.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendText(); }}
                placeholder="Type a message…"
                className="flex-1 rounded-lg bg-black/50 border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                maxLength={2000}
              />
              <button
                onClick={() => setShowGifBoard(true)}
                title="Send a GIF"
                className="rounded-lg bg-fuchsia-700/40 border border-fuchsia-500/40 hover:bg-fuchsia-700/70 px-3 py-2 text-lg transition"
              >
                🎭
              </button>
              <button
                onClick={handleSendText}
                className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-semibold transition"
              >
                Send
              </button>
            </div>
          </div>
        </section>

        {/* GIF Board Modal */}
        <GifBoard
          isOpen={showGifBoard}
          onClose={() => setShowGifBoard(false)}
          onSelect={handleSendGif}
        />

        {/* Nickname Modal */}
        <NicknameModal
          isOpen={showNicknameModal}
          onClose={() => setShowNicknameModal(false)}
          onConfirm={handleNicknameConfirm}
          title="Set Your Nickname"
        />
      </main>
    </div>
  );
}
