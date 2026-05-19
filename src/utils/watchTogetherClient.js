const POLL_INTERVAL_MS = 1200;
const PARTICIPANT_ID_KEY = "watchTogetherParticipantId";

function getParticipantId() {
  if (typeof globalThis === "undefined") {
    return `participant-${Math.random().toString(36).slice(2, 10)}`;
  }

  try {
    const existing = globalThis.localStorage?.getItem(PARTICIPANT_ID_KEY);
    if (existing) {
      return existing;
    }

    const nextId = globalThis.crypto?.randomUUID?.() || `participant-${Math.random().toString(36).slice(2, 10)}`;
    globalThis.localStorage?.setItem(PARTICIPANT_ID_KEY, nextId);
    return nextId;
  } catch {
    return globalThis.crypto?.randomUUID?.() || `participant-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function toQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

export function createWatchTogetherClient({ onStatusChange } = {}) {
  const handlers = new Map();
  const participantId = getParticipantId();

  let connected = false;
  let closed = false;
  let roomId = "";
  let nickname = "Guest";
  let cursor = 0;
  let pollTimer = null;
  let pollInFlight = false;

  const emitLocal = (eventName, payload) => {
    const eventHandlers = handlers.get(eventName);
    if (!eventHandlers) return;

    eventHandlers.forEach((handler) => {
      handler(payload);
    });
  };

  const setConnected = (nextValue) => {
    if (connected === nextValue) return;
    connected = nextValue;
    onStatusChange?.(nextValue);
  };

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

  const processEvents = (events) => {
    (events || []).forEach((event) => {
      cursor = Math.max(cursor, Number(event?.cursor || 0));
      if (!event?.kind) return;
      emitLocal(event.kind, event.payload);
    });
  };

  const poll = async () => {
    if (closed || !roomId || pollInFlight) return;

    pollInFlight = true;

    try {
      const query = toQueryString({
        roomId,
        after: cursor,
        participantId,
        nickname,
      });
      const data = await request(`/api/watch-together/realtime?${query}`, {
        method: "GET",
      });
      cursor = Math.max(cursor, Number(data?.cursor || 0));
      setConnected(Boolean(data?.configured));
      processEvents(data?.events || []);
    } catch {
      setConnected(false);
    } finally {
      pollInFlight = false;
      if (!closed && roomId) {
        pollTimer = globalThis.setTimeout(() => {
          void poll();
        }, POLL_INTERVAL_MS);
      }
    }
  };

  const scheduleImmediatePoll = () => {
    if (closed || !roomId) return;
    if (pollTimer) {
      globalThis.clearTimeout(pollTimer);
      pollTimer = null;
    }
    void poll();
  };

  const emit = async (eventName, payload = {}, ack) => {
    switch (eventName) {
      case "join-room": {
        const nextRoomId = String(payload.roomId || "");
        const nextNickname = String(payload.nickname || "Guest").trim() || "Guest";
        if (!nextRoomId) return null;

        roomId = nextRoomId;
        nickname = nextNickname;

        const data = await request("/api/watch-together/realtime", {
          method: "POST",
          body: JSON.stringify({
            action: "join-room",
            roomId,
            participantId,
            nickname,
          }),
        });

        cursor = Math.max(cursor, Number(data?.cursor || 0));
        setConnected(Boolean(data?.configured ?? true));

        if (data?.snapshot?.referenceState) {
          emitLocal("state-update", data.snapshot.referenceState);
        }

        scheduleImmediatePoll();
        return data;
      }
      case "leave-room": {
        if (!roomId) return null;

        const data = await request("/api/watch-together/realtime", {
          method: "POST",
          body: JSON.stringify({
            action: "leave-room",
            roomId,
            participantId,
          }),
        });
        setConnected(false);
        return data;
      }
      case "send-message": {
        const targetRoom = String(payload.roomId || roomId || "");
        if (!targetRoom) return null;

        const data = await request("/api/watch-together/realtime", {
          method: "POST",
          body: JSON.stringify({
            action: "send-message",
            roomId: targetRoom,
            participantId,
            nickname,
            message: payload.message,
          }),
        });
        scheduleImmediatePoll();
        return data;
      }
      case "sync-state": {
        const targetRoom = String(payload.roomId || roomId || "");
        if (!targetRoom) return null;

        const data = await request("/api/watch-together/realtime", {
          method: "POST",
          body: JSON.stringify({
            action: "sync-state",
            roomId: targetRoom,
            participantId,
            nickname,
            state: payload.state,
          }),
        });
        scheduleImmediatePoll();
        return data;
      }
      case "sync-play": {
        const targetRoom = String(payload.roomId || roomId || "");
        if (!targetRoom) return null;

        const data = await request("/api/watch-together/realtime", {
          method: "POST",
          body: JSON.stringify({
            action: "sync-play",
            roomId: targetRoom,
          }),
        });
        scheduleImmediatePoll();
        return data;
      }
      case "sync-check": {
        const targetRoom = String(payload.roomId || roomId || "");
        if (!targetRoom) {
          ack?.(null);
          return null;
        }

        const query = toQueryString({ action: "snapshot", roomId: targetRoom });
        const data = await request(`/api/watch-together/realtime?${query}`, {
          method: "GET",
        });
        ack?.(data?.snapshot || null);
        return data?.snapshot || null;
      }
      default:
        return null;
    }
  };

  const disconnect = () => {
    closed = true;

    if (pollTimer) {
      globalThis.clearTimeout(pollTimer);
      pollTimer = null;
    }

    if (roomId) {
      const body = JSON.stringify({
        action: "leave-room",
        roomId,
        participantId,
      });

      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(
          "/api/watch-together/realtime",
          new Blob([body], { type: "application/json" }),
        );
      } else {
        fetch("/api/watch-together/realtime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
          keepalive: true,
        }).catch(() => undefined);
      }
    }

    setConnected(false);
  };

  return {
    emit,
    on(eventName, handler) {
      const existing = handlers.get(eventName) || new Set();
      existing.add(handler);
      handlers.set(eventName, existing);
    },
    off(eventName, handler) {
      const existing = handlers.get(eventName);
      if (!existing) return;
      existing.delete(handler);
      if (existing.size === 0) {
        handlers.delete(eventName);
      }
    },
    disconnect,
  };
}
