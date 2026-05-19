import { Server } from "socket.io";

export function initWatchTogetherSocket(httpServer) {
  const io = new Server(httpServer, {
    path: "/api/socket_io",
    addTrailingSlash: false,
  });

  // Per-room playback state so new joiners get the current episode/server
  const roomStates = new Map();

  io.on("connection", (socket) => {
    socket.on("join-room", ({ roomId, nickname }) => {
      if (!roomId) return;

      socket.join(roomId);
      socket.data.nickname = nickname || "Guest";

      socket.to(roomId).emit("system-message", {
        id: `sys-${Date.now()}`,
        text: `${socket.data.nickname} joined the room`,
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

      const safeMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: String(message.text).slice(0, 2000),
        type: message.type === "gif" ? "gif" : "text",
        nickname: String(message.nickname || socket.data.nickname || "Guest").slice(0, 40),
        createdAt: Date.now(),
      };

      io.to(roomId).emit("new-message", safeMessage);
    });

    // A user changed server / season / episode — broadcast to everyone else
    socket.on("sync-state", ({ roomId, state }) => {
      if (!roomId || !state) return;
      roomStates.set(roomId, state);
      socket.to(roomId).emit("state-update", state);
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
        socket.to(roomId).emit("system-message", {
          id: `sys-${Date.now()}`,
          text: `${socket.data.nickname || "Guest"} left the room`,
          createdAt: Date.now(),
        });
      });
    });
  });

  return io;
}

