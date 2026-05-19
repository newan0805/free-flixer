import { Server } from "socket.io";

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

export function initWatchTogetherSocket(httpServer) {
  const io = new Server(httpServer, {
    path: "/api/socket_io",
    addTrailingSlash: false,
  });

  // Per-room playback state so new joiners get the current episode/server
  const roomStates = new Map();
  // Per-room participant snapshots so the client can compare timelines before syncing.
  const roomParticipants = new Map();

  const getRoomParticipants = (roomId) => {
    if (!roomId) return new Map();

    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Map());
    }

    return roomParticipants.get(roomId);
  };

  const getTimelineScore = (state) => {
    if (!state) return -1;

    const season = Number.parseInt(state.season ?? 1, 10) || 1;
    const episode = Number.parseInt(state.episode ?? 1, 10) || 1;
    return (season * 1000) + episode;
  };

  const serializeParticipant = (socketId, participant) => ({
    socketId,
    nickname: participant.nickname || "Guest",
    state: participant.state || null,
    updatedAt: participant.updatedAt || 0,
  });

  const buildRoomSnapshot = (roomId) => {
    const participants = [...getRoomParticipants(roomId).entries()].map(([socketId, participant]) =>
      serializeParticipant(socketId, participant),
    );

    const sameContentParticipants = participants.filter((participant) => {
      if (!participant.state) return false;
      const reference = roomStates.get(roomId);
      if (!reference) return true;
      return participant.state.type === reference.type && participant.state.tmdbId === reference.tmdbId;
    });

    const leader = [...sameContentParticipants].sort((a, b) => {
      const scoreDiff = getTimelineScore(b.state) - getTimelineScore(a.state);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    })[0] || null;

    const localMismatch = sameContentParticipants.some((participant) => {
      if (!leader?.state || !participant.state) return false;
      return getTimelineScore(participant.state) !== getTimelineScore(leader.state)
        || participant.state.server !== leader.state.server;
    });

    return {
      roomId,
      participants,
      leader,
      localMismatch,
      referenceState: roomStates.get(roomId) || null,
    };
  };

  io.on("connection", (socket) => {
    socket.on("join-room", ({ roomId, nickname }) => {
      if (!roomId) return;

      socket.join(roomId);
      socket.data.nickname = nickname || "Guest";
      socket.data.roomId = roomId;

      const participants = getRoomParticipants(roomId);
      participants.set(socket.id, {
        nickname: socket.data.nickname,
        state: null,
        updatedAt: Date.now(),
      });

      socket.to(roomId).emit("system-message", {
        id: `sys-${Date.now()}`,
        text: sanitizeChatText(`${socket.data.nickname} joined the room`),
        createdAt: Date.now(),
      });

      // Send the current playback state to the new joiner
      const state = roomStates.get(roomId);
      if (state) {
        socket.emit("state-update", state);
      }
    });

    socket.on("send-message", ({ roomId, message }) => {
      if (!roomId || !message?.text) return;

      const messageType = message.type === "gif" ? "gif" : "text";

      const safeMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text:
          messageType === "gif"
            ? String(message.text).slice(0, 2000)
            : sanitizeChatText(String(message.text).slice(0, 2000)),
        type: messageType,
        nickname: sanitizeChatText(String(message.nickname || socket.data.nickname || "Guest").slice(0, 40)),
        createdAt: Date.now(),
      };

      io.to(roomId).emit("new-message", safeMessage);
    });

    // A user changed server / season / episode — broadcast to everyone else
    socket.on("sync-state", ({ roomId, state }) => {
      if (!roomId || !state) return;
      roomStates.set(roomId, state);
      const participants = getRoomParticipants(roomId);
      const existing = participants.get(socket.id) || { nickname: socket.data.nickname || "Guest" };
      participants.set(socket.id, {
        ...existing,
        nickname: existing.nickname || socket.data.nickname || "Guest",
        state,
        updatedAt: Date.now(),
      });
      socket.to(roomId).emit("state-update", state);
    });

    socket.on("sync-check", ({ roomId }, ack) => {
      if (!roomId || typeof ack !== "function") return;

      ack(buildRoomSnapshot(roomId));
    });

    // Host triggered a sync-play — broadcast a precise start timestamp to the whole room
    socket.on("sync-play", ({ roomId }) => {
      if (!roomId) return;
      const at = Date.now() + 3200; // 3.2 s gives time for countdown display
      io.to(roomId).emit("do-sync-play", { at });
    });

    socket.on("disconnecting", () => {
      const roomIds = [...socket.rooms].filter((room) => room !== socket.id);
      roomIds.forEach((roomId) => {
        const participants = roomParticipants.get(roomId);
        if (participants) {
          participants.delete(socket.id);
          if (participants.size === 0) {
            roomParticipants.delete(roomId);
            roomStates.delete(roomId);
          }
        }

        socket.to(roomId).emit("system-message", {
          id: `sys-${Date.now()}`,
          text: sanitizeChatText(`${socket.data.nickname || "Guest"} left the room`),
          createdAt: Date.now(),
        });
      });
    });
  });

  return io;
}

