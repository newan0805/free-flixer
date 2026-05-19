"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import PropTypes from 'prop-types';
import { getAvailableServers, getSavedServer, saveServer, getEmbedUrl } from "@utils/servers";

/**
 * Parses a watch path like /watch/movie/123 or /watch/tv/456?season=2&episode=3
 * Returns { type, tmdbId, season, episode } or null
 */
export function parseWatchPath(path) {
  if (!path) return null;
  try {
    // Accept both relative paths and full URLs
    const url = path.startsWith("http") ? new URL(path) : new URL(path, "http://x");
    const parts = url.pathname.split("/").filter(Boolean);
    // parts: ["watch", "movie"|"tv", "<id>"]
    if (parts[0] !== "watch" || !parts[1] || !parts[2]) return null;
    const type = parts[1]; // "movie" or "tv"
    const tmdbId = parts[2];
    const season = Number.parseInt(url.searchParams.get("season") || "1", 10);
    const episode = Number.parseInt(url.searchParams.get("episode") || "1", 10);
    return { type, tmdbId, season, episode };
  } catch {
    return null;
  }
}

/**
 * Inline video player for the Watch Together room.
 * When `socket` and `roomId` are provided, server/episode controls are synced
 * across all room members, and "Sync Play" reloads the iframe for everyone simultaneously.
 */
export default function RoomPlayer({ watchUrl, title, socket, roomId }) {
  const info = useMemo(() => parseWatchPath(watchUrl), [watchUrl]);

  const allServers = getAvailableServers();

  const [selectedServer, setSelectedServer] = useState(
    getSavedServer() || (allServers[0]?.id ?? "")
  );
  const [season, setSeason] = useState(info?.season ?? 1);
  const [episode, setEpisode] = useState(info?.episode ?? 1);
  const [playKey, setPlayKey] = useState(0); // increment forces iframe reload
  const [syncCountdown, setSyncCountdown] = useState(null); // 3,2,1,"▶",null

  const countdownRef = useRef(null);
  const prevWatchUrl = useRef(watchUrl);
  const roomIdRef = useRef(roomId);
  const selectedServerRef = useRef(selectedServer);
  const seasonRef = useRef(season);
  const episodeRef = useRef(episode);

  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { selectedServerRef.current = selectedServer; }, [selectedServer]);
  useEffect(() => { seasonRef.current = season; }, [season]);
  useEffect(() => { episodeRef.current = episode; }, [episode]);

  const isSocketSupportedHost = useCallback(() => {
    if (globalThis.window === undefined) return false;

    const hostname = globalThis.window.location.hostname;
    return hostname === "localhost"
      || hostname === "127.0.0.1"
      || hostname.endsWith(".local")
      || hostname.includes("vercel.app") === false;
  }, []);

  const syncUnavailable = useMemo(() => !isSocketSupportedHost(), [isSocketSupportedHost]);

  // Reset season/episode when the content changes
  useEffect(() => {
    if (watchUrl !== prevWatchUrl.current) {
      prevWatchUrl.current = watchUrl;
      if (info) {
        globalThis.setTimeout(() => {
          setSeason(info.season ?? 1);
          setEpisode(info.episode ?? 1);
        }, 0);
      }
    }
  }, [watchUrl, info]);

  const buildLocalState = useCallback((overrides = {}) => {
    if (!info) return null;

    return {
      type: info.type,
      tmdbId: info.tmdbId,
      server: overrides.server ?? selectedServerRef.current,
      season: overrides.season ?? seasonRef.current,
      episode: overrides.episode ?? episodeRef.current,
    };
  }, [info]);

  const sameTimeline = useCallback((left, right) => {
    if (!left || !right) return false;

    return left.type === right.type
      && left.tmdbId === right.tmdbId
      && left.server === right.server
      && Number(left.season) === Number(right.season)
      && Number(left.episode) === Number(right.episode);
  }, []);

  const formatTimeline = useCallback((state) => {
    if (!state) return "unknown timeline";

    const chapter = state.type === "tv"
      ? `S${state.season} E${state.episode}`
      : "movie";

    return `${chapter} on server ${state.server || "default"}`;
  }, []);

  const requestSyncSnapshot = useCallback(() => {
    if (!socket || !roomIdRef.current) return Promise.resolve(null);

    return new Promise((resolve) => {
      socket.emit("sync-check", { roomId: roomIdRef.current }, (snapshot) => {
        resolve(snapshot || null);
      });
    });
  }, [socket]);

  const startSyncCountdown = useCallback((at) => {
    if (countdownRef.current) clearTimeout(countdownRef.current);

    const updateCountdown = () => {
      const remaining = Math.ceil((at - Date.now()) / 1000);
      if (remaining > 0) {
        setSyncCountdown(remaining);
        countdownRef.current = setTimeout(updateCountdown, 200);
        return;
      }

      setSyncCountdown("▶");
      setPlayKey((currentKey) => currentKey + 1);
      countdownRef.current = setTimeout(() => setSyncCountdown(null), 900);
    };

    updateCountdown();
  }, []);

  const embedUrl = useMemo(() => {
    if (!info) return null;
    return getEmbedUrl(selectedServer, {
      contentType: info.type,
      tmdbId: info.tmdbId,
      season,
      episode,
    });
  }, [info, selectedServer, season, episode]);

  // ── Emit the current playback state to the room ─────────────────────────
  const emitSyncState = useCallback(
    (overrides = {}) => {
      if (!socket || !roomId || !info) return;
      socket.emit("sync-state", {
        roomId,
        state: {
          type: info.type,
          tmdbId: info.tmdbId,
          server: overrides.server ?? selectedServer,
          season: overrides.season ?? season,
          episode: overrides.episode ?? episode,
        },
      });
    },
    [socket, roomId, info, selectedServer, season, episode]
  );

  // ── Listen for state-update and do-sync-play from the room ───────────────
  useEffect(() => {
    if (!socket) return;

    if (!isSocketSupportedHost()) {
      return;
    }

    const handleStateUpdate = ({ server, season: s, episode: e }) => {
      if (server !== undefined) { setSelectedServer(server); saveServer(server); }
      if (s !== undefined) setSeason(s);
      if (e !== undefined) setEpisode(e);
    };

    const handleSyncPlay = ({ at }) => {
      startSyncCountdown(at);
    };

    const handleConnect = () => {
      const initialState = buildLocalState();
      if (initialState && roomIdRef.current) {
        socket.emit("sync-state", { roomId: roomIdRef.current, state: initialState });
      }
    };

    socket.on("state-update", handleStateUpdate);
    socket.on("do-sync-play", handleSyncPlay);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("state-update", handleStateUpdate);
      socket.off("do-sync-play", handleSyncPlay);
      socket.off("connect", handleConnect);
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [socket, buildLocalState, isSocketSupportedHost, startSyncCountdown]);

  // ── Control handlers ─────────────────────────────────────────────────────
  const handleServerChange = (val) => {
    setSelectedServer(val);
    saveServer(val);
    emitSyncState({ server: val });
  };

  const handleSeasonChange = (val) => {
    setSeason(val);
    setEpisode(1);
    emitSyncState({ season: val, episode: 1 });
  };

  const handleEpisodeChange = (val) => {
    setEpisode(val);
    emitSyncState({ episode: val });
  };

  const handleSyncPlay = async () => {
    if (!socket || !roomId || syncCountdown !== null || syncUnavailable) return;

    const snapshot = await requestSyncSnapshot();
    const participants = Array.isArray(snapshot?.participants) ? snapshot.participants : [];
    const activeParticipants = participants.filter((participant) => participant.state);
    const leader = snapshot?.leader || activeParticipants[0] || null;
    const localState = buildLocalState();

    const mismatch = Boolean(leader?.state) && !sameTimeline(localState, leader.state);
    if (!mismatch) {
      socket.emit("sync-play", { roomId });
      return;
    }

    const participantLines = activeParticipants.length > 0
      ? activeParticipants.map((participant) => `${participant.nickname}: ${formatTimeline(participant.state)}`).join("\n")
      : "No participant timeline data is available yet.";

    const leaderLabel = leader?.nickname
      ? `${leader.nickname} (${formatTimeline(leader.state)})`
      : "the most advanced timeline";

    const shouldSync = globalThis.confirm(
      `Room timelines do not match.\n\nMost advanced: ${leaderLabel}\n\nRoom timelines:\n${participantLines}\n\nSync everyone to the most advanced timeline? Choose Cancel to keep playing without syncing.`
    );

    if (!shouldSync || !leader?.state) {
      return;
    }

    const alignedState = {
      type: leader.state.type ?? localState?.type,
      tmdbId: leader.state.tmdbId ?? localState?.tmdbId,
      server: leader.state.server ?? selectedServerRef.current,
      season: leader.state.season ?? seasonRef.current,
      episode: leader.state.episode ?? episodeRef.current,
    };

    setSelectedServer(alignedState.server);
    setSeason(alignedState.season);
    setEpisode(alignedState.episode);
    saveServer(alignedState.server);

    socket.emit("sync-state", { roomId, state: alignedState });
    socket.emit("sync-play", { roomId });
  };

  if (!info) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-black/30 flex items-center justify-center p-8 text-slate-400 text-sm">
        Add a watch link to start playing.
      </div>
    );
  }

  let syncButtonLabel = "⟳ Sync Play";
  if (syncUnavailable) {
    syncButtonLabel = "Sync unavailable on this host";
  } else if (syncCountdown !== null) {
    syncButtonLabel = <span className="tabular-nums">{syncCountdown}</span>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
        {/* Server selector */}
        {allServers.length > 1 && (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label htmlFor="room-player-server" className="text-xs text-slate-400 tracking-wide">Server</label>
            <select
              id="room-player-server"
              value={selectedServer}
              onChange={(e) => handleServerChange(e.target.value)}
              className="h-9 px-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm focus:outline-none"
            >
              {allServers.map((s) => (
                <option key={s.id} value={s.id} className="bg-black">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Season / Episode selectors for TV */}
        {info.type === "tv" && (
          <>
            <div className="flex flex-col gap-1 min-w-[80px]">
              <label htmlFor="room-player-season" className="text-xs text-slate-400 tracking-wide">Season</label>
              <input
                id="room-player-season"
                type="number"
                min={1}
                value={season}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10);
                  if (v > 0) handleSeasonChange(v);
                }}
                className="h-9 px-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm w-16 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[80px]">
              <label htmlFor="room-player-episode" className="text-xs text-slate-400 tracking-wide">Episode</label>
              <div className="flex items-center gap-1">
                <input
                  id="room-player-episode"
                  type="number"
                  min={1}
                  value={episode}
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value, 10);
                    if (v > 0) handleEpisodeChange(v);
                  }}
                  className="h-9 px-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm w-16 focus:outline-none"
                />
                <button
                  onClick={() => handleEpisodeChange(episode + 1)}
                  className="h-9 px-3 rounded-lg bg-blue-600/30 border border-blue-400/50 text-white text-xs hover:bg-blue-600/50 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Sync Play — only when connected */}
        {socket && roomId && (
          <button
            onClick={handleSyncPlay}
            disabled={syncCountdown !== null || syncUnavailable}
            title="Reload the player for everyone at the same time"
            className="h-9 px-4 rounded-lg bg-green-600/25 border border-green-400/50 text-white text-xs font-semibold hover:bg-green-600/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {syncButtonLabel}
          </button>
        )}

        {/* Info chips */}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 capitalize">
            {info.type}
          </span>
          {info.type === "tv" && (
            <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10">
              S{season} E{episode}
            </span>
          )}
          {socket && roomId && (
            <span className="px-2 py-1 rounded-full bg-green-900/40 border border-green-400/30 text-green-300">
              synced
            </span>
          )}
          {syncUnavailable && (
            <span className="px-2 py-1 rounded-full bg-amber-900/40 border border-amber-400/30 text-amber-300">
              realtime sync needs a persistent Node host
            </span>
          )}
        </div>
      </div>

      {/* Player */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        {/* Sync countdown overlay */}
        {syncCountdown !== null && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85 rounded-xl gap-3">
            <span className="text-8xl font-black text-white drop-shadow-2xl animate-pulse">
              {syncCountdown}
            </span>
            <span className="text-sm text-slate-300 tracking-widest uppercase">
              {typeof syncCountdown === "number" ? "syncing…" : "go!"}
            </span>
          </div>
        )}

        {embedUrl ? (
          <iframe
            key={`${embedUrl}-${playKey}`}
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={title || "Watch Together Player"}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
}

RoomPlayer.propTypes = {
  watchUrl: PropTypes.string.isRequired,
  title: PropTypes.string,
  socket: PropTypes.shape({
    emit: PropTypes.func,
    on: PropTypes.func,
    off: PropTypes.func,
  }),
  roomId: PropTypes.string,
};
