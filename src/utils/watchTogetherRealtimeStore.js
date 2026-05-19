const ROOM_TTL_SECONDS = 60 * 60 * 6;
const PRESENCE_TTL_MS = 45_000;
const EVENT_LIMIT = 150;

function sanitizeChatText(text) {
  return String(text ?? "").replace(/[&<>"]|'/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function createMemoryStore() {
  return {
    participants: new Map(),
    states: new Map(),
    events: new Map(),
    cursors: new Map(),
  };
}

function getMemoryStore() {
  if (!globalThis.__watchTogetherRealtimeStore) {
    globalThis.__watchTogetherRealtimeStore = createMemoryStore();
  }

  return globalThis.__watchTogetherRealtimeStore;
}

function getEnvValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return "";
}

function getRedisConfig() {
  const url = getEnvValue("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
  const token = getEnvValue("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  return { url, token, enabled: Boolean(url && token) };
}

async function runRedisPipeline(commands) {
  const { url, token, enabled } = getRedisConfig();
  if (!enabled) {
    throw new Error("KV store is not configured");
  }

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "KV pipeline request failed");
  }

  const data = await response.json();
  data.forEach((entry) => {
    if (entry?.error) {
      throw new Error(entry.error);
    }
  });

  return data.map((entry) => entry?.result);
}

function getRoomKeys(roomId) {
  return {
    participants: `wt:room:${roomId}:participants`,
    state: `wt:room:${roomId}:state`,
    events: `wt:room:${roomId}:events`,
    cursor: `wt:room:${roomId}:cursor`,
  };
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function pruneParticipants(participants) {
  const threshold = Date.now() - PRESENCE_TTL_MS;
  const nextParticipants = {};

  Object.entries(participants || {}).forEach(([participantId, participant]) => {
    if ((participant?.updatedAt || 0) >= threshold) {
      nextParticipants[participantId] = participant;
    }
  });

  return nextParticipants;
}

function serializeParticipant(participantId, participant) {
  return {
    participantId,
    nickname: participant?.nickname || "Guest",
    state: participant?.state || null,
    updatedAt: participant?.updatedAt || 0,
  };
}

function getTimelineScore(state) {
  if (!state) return -1;

  const season = Number.parseInt(state.season ?? 1, 10) || 1;
  const episode = Number.parseInt(state.episode ?? 1, 10) || 1;
  return (season * 1000) + episode;
}

function buildRoomSnapshot(roomId, participants, referenceState) {
  const serialized = Object.entries(pruneParticipants(participants)).map(([participantId, participant]) =>
    serializeParticipant(participantId, participant),
  );

  const sameContentParticipants = serialized.filter((participant) => {
    if (!participant.state) return false;
    if (!referenceState) return true;

    return participant.state.type === referenceState.type
      && participant.state.tmdbId === referenceState.tmdbId;
  });

  const leader = [...sameContentParticipants].sort((left, right) => {
    const scoreDiff = getTimelineScore(right.state) - getTimelineScore(left.state);
    if (scoreDiff !== 0) return scoreDiff;
    return (right.updatedAt || 0) - (left.updatedAt || 0);
  })[0] || null;

  const localMismatch = sameContentParticipants.some((participant) => {
    if (!leader?.state || !participant.state) return false;

    return getTimelineScore(participant.state) !== getTimelineScore(leader.state)
      || participant.state.server !== leader.state.server;
  });

  return {
    roomId,
    participants: serialized,
    leader,
    localMismatch,
    referenceState: referenceState || null,
  };
}

async function loadRoomState(roomId) {
  const { enabled } = getRedisConfig();
  const keys = getRoomKeys(roomId);

  if (!enabled) {
    const memoryStore = getMemoryStore();
    return {
      participants: pruneParticipants(memoryStore.participants.get(roomId) || {}),
      referenceState: memoryStore.states.get(roomId) || null,
      events: memoryStore.events.get(roomId) || [],
      cursor: memoryStore.cursors.get(roomId) || 0,
      mode: "memory",
    };
  }

  const [participantsRaw, stateRaw, eventsRaw, cursorRaw] = await runRedisPipeline([
    ["GET", keys.participants],
    ["GET", keys.state],
    ["LRANGE", keys.events, -EVENT_LIMIT, -1],
    ["GET", keys.cursor],
  ]);

  return {
    participants: pruneParticipants(safeJsonParse(participantsRaw, {})),
    referenceState: safeJsonParse(stateRaw, null),
    events: Array.isArray(eventsRaw) ? eventsRaw.map((entry) => safeJsonParse(entry, null)).filter(Boolean) : [],
    cursor: Number.parseInt(cursorRaw || "0", 10) || 0,
    mode: "kv",
  };
}

async function saveParticipants(roomId, participants) {
  const { enabled } = getRedisConfig();
  const nextParticipants = pruneParticipants(participants);

  if (!enabled) {
    const memoryStore = getMemoryStore();
    memoryStore.participants.set(roomId, nextParticipants);
    return;
  }

  const keys = getRoomKeys(roomId);
  await runRedisPipeline([
    ["SET", keys.participants, JSON.stringify(nextParticipants), "EX", ROOM_TTL_SECONDS],
  ]);
}

async function saveReferenceState(roomId, state) {
  const { enabled } = getRedisConfig();

  if (!enabled) {
    const memoryStore = getMemoryStore();
    memoryStore.states.set(roomId, state);
    return;
  }

  const keys = getRoomKeys(roomId);
  await runRedisPipeline([
    ["SET", keys.state, JSON.stringify(state), "EX", ROOM_TTL_SECONDS],
  ]);
}

async function appendEvent(roomId, kind, payload) {
  const { enabled } = getRedisConfig();
  const createdAt = Date.now();

  if (!enabled) {
    const memoryStore = getMemoryStore();
    const nextCursor = (memoryStore.cursors.get(roomId) || 0) + 1;
    memoryStore.cursors.set(roomId, nextCursor);

    const nextEvent = {
      cursor: nextCursor,
      kind,
      payload,
      createdAt,
    };

    const existing = memoryStore.events.get(roomId) || [];
    memoryStore.events.set(roomId, [...existing, nextEvent].slice(-EVENT_LIMIT));
    return nextEvent;
  }

  const keys = getRoomKeys(roomId);
  const [cursorValue] = await runRedisPipeline([
    ["INCR", keys.cursor],
  ]);
  const nextCursor = Number.parseInt(String(cursorValue), 10) || 0;

  const nextEvent = {
    cursor: nextCursor,
    kind,
    payload,
    createdAt,
  };

  await runRedisPipeline([
    ["RPUSH", keys.events, JSON.stringify(nextEvent)],
    ["LTRIM", keys.events, -EVENT_LIMIT, -1],
    ["EXPIRE", keys.events, ROOM_TTL_SECONDS],
    ["EXPIRE", keys.cursor, ROOM_TTL_SECONDS],
  ]);

  return nextEvent;
}

async function saveRoomState(roomId, updater) {
  const current = await loadRoomState(roomId);
  const next = await updater(current);
  const participants = pruneParticipants(next.participants || {});

  await saveParticipants(roomId, participants);

  if (next.referenceState !== undefined) {
    await saveReferenceState(roomId, next.referenceState);
  }

  return {
    participants,
    referenceState: next.referenceState,
    events: current.events,
    cursor: current.cursor,
  };
}

function buildSystemMessage(text) {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: sanitizeChatText(text).slice(0, 2000),
    type: "system",
    nickname: "System",
    createdAt: Date.now(),
  };
}

function normalizeNickname(nickname) {
  return sanitizeChatText(String(nickname || "Guest").slice(0, 40)) || "Guest";
}

function normalizeMessage(message, fallbackNickname) {
  const messageType = message?.type === "gif" ? "gif" : "text";
  const rawText = String(message?.text || "").slice(0, 2000);

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: messageType === "gif" ? rawText : sanitizeChatText(rawText),
    type: messageType,
    nickname: normalizeNickname(message?.nickname || fallbackNickname),
    createdAt: Date.now(),
  };
}

export function isRealtimeStoreConfigured() {
  return getRedisConfig().enabled || process.env.NODE_ENV !== "production";
}

export async function joinWatchTogetherRoom({ roomId, participantId, nickname }) {
  let existed = false;
  const safeNickname = normalizeNickname(nickname);

  await saveRoomState(roomId, async (current) => {
    const nextParticipants = { ...current.participants };
    existed = Boolean(nextParticipants[participantId]);
    nextParticipants[participantId] = {
      nickname: safeNickname,
      state: nextParticipants[participantId]?.state || null,
      updatedAt: Date.now(),
    };

    return {
      participants: nextParticipants,
      referenceState: current.referenceState,
    };
  });

  if (!existed) {
    await appendEvent(roomId, "system-message", buildSystemMessage(`${safeNickname} joined the room`));
  }

  const latest = await loadRoomState(roomId);
  return {
    cursor: latest.cursor,
    snapshot: buildRoomSnapshot(roomId, latest.participants, latest.referenceState),
  };
}

export async function leaveWatchTogetherRoom({ roomId, participantId }) {
  const current = await loadRoomState(roomId);
  const participant = current.participants[participantId];
  if (!participant) {
    return { cursor: current.cursor };
  }

  const nextParticipants = { ...current.participants };
  delete nextParticipants[participantId];
  await saveParticipants(roomId, nextParticipants);
  await appendEvent(roomId, "system-message", buildSystemMessage(`${participant.nickname || "Guest"} left the room`));

  const latest = await loadRoomState(roomId);
  return {
    cursor: latest.cursor,
    snapshot: buildRoomSnapshot(roomId, latest.participants, latest.referenceState),
  };
}

export async function heartbeatWatchTogetherRoom({ roomId, participantId, nickname }) {
  if (!roomId || !participantId) return null;

  await saveRoomState(roomId, async (current) => {
    const participant = current.participants[participantId];
    if (!participant) {
      return current;
    }

    return {
      participants: {
        ...current.participants,
        [participantId]: {
          ...participant,
          nickname: normalizeNickname(nickname || participant.nickname),
          updatedAt: Date.now(),
        },
      },
      referenceState: current.referenceState,
    };
  });

  const latest = await loadRoomState(roomId);
  return buildRoomSnapshot(roomId, latest.participants, latest.referenceState);
}

export async function sendWatchTogetherMessage({ roomId, participantId, message, nickname }) {
  const current = await loadRoomState(roomId);
  const safeNickname = normalizeNickname(nickname || current.participants[participantId]?.nickname || "Guest");
  const safeMessage = normalizeMessage(message, safeNickname);

  await saveRoomState(roomId, async (room) => {
    const participant = room.participants[participantId];
    if (!participant) {
      return room;
    }

    return {
      participants: {
        ...room.participants,
        [participantId]: {
          ...participant,
          nickname: safeNickname,
          updatedAt: Date.now(),
        },
      },
      referenceState: room.referenceState,
    };
  });

  const nextEvent = await appendEvent(roomId, "new-message", safeMessage);
  return { cursor: nextEvent.cursor, message: safeMessage };
}

export async function updateWatchTogetherState({ roomId, participantId, nickname, state }) {
  const safeNickname = normalizeNickname(nickname);
  await saveRoomState(roomId, async (current) => {
    const nextParticipants = { ...current.participants };
    const previousParticipant = nextParticipants[participantId] || {
      nickname: safeNickname,
      state: null,
      updatedAt: 0,
    };

    nextParticipants[participantId] = {
      ...previousParticipant,
      nickname: safeNickname,
      state,
      updatedAt: Date.now(),
    };

    return {
      participants: nextParticipants,
      referenceState: state,
    };
  });

  const nextEvent = await appendEvent(roomId, "state-update", state);
  return { cursor: nextEvent.cursor, state };
}

export async function triggerWatchTogetherSyncPlay({ roomId }) {
  const payload = { at: Date.now() + 3200 };
  const nextEvent = await appendEvent(roomId, "do-sync-play", payload);
  return { cursor: nextEvent.cursor, payload };
}

export async function getWatchTogetherSnapshot(roomId) {
  const current = await loadRoomState(roomId);
  return {
    cursor: current.cursor,
    snapshot: buildRoomSnapshot(roomId, current.participants, current.referenceState),
  };
}

export async function pollWatchTogetherRoom({ roomId, afterCursor = 0, participantId = "", nickname = "" }) {
  if (participantId) {
    await heartbeatWatchTogetherRoom({ roomId, participantId, nickname });
  }

  const current = await loadRoomState(roomId);
  const events = current.events.filter((event) => Number(event?.cursor || 0) > Number(afterCursor || 0));

  return {
    cursor: current.cursor,
    events,
    snapshot: buildRoomSnapshot(roomId, current.participants, current.referenceState),
    configured: isRealtimeStoreConfigured(),
    mode: current.mode,
  };
}
