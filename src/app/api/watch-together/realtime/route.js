import { NextResponse } from "next/server";
import {
  getWatchTogetherSnapshot,
  heartbeatWatchTogetherRoom,
  isRealtimeStoreConfigured,
  joinWatchTogetherRoom,
  leaveWatchTogetherRoom,
  pollWatchTogetherRoom,
  sendWatchTogetherMessage,
  triggerWatchTogetherSyncPlay,
  updateWatchTogetherState,
} from "@utils/watchTogetherRealtimeStore";

export const runtime = "nodejs";

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serviceUnavailable(message) {
  return NextResponse.json({ error: message, configured: false }, { status: 503 });
}

function getRoomId(value) {
  return String(value || "").trim().slice(0, 120);
}

function getParticipantId(value) {
  return String(value || "").trim().slice(0, 120);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "poll";
  const roomId = getRoomId(searchParams.get("roomId"));

  if (!roomId) {
    return badRequest("roomId is required");
  }

  if (!isRealtimeStoreConfigured()) {
    return serviceUnavailable("Watch Together realtime requires KV_REST_API_URL and KV_REST_API_TOKEN on Vercel.");
  }

  try {
    if (action === "snapshot") {
      const data = await getWatchTogetherSnapshot(roomId);
      return NextResponse.json({ ...data, configured: true });
    }

    const participantId = getParticipantId(searchParams.get("participantId"));
    const nickname = searchParams.get("nickname") || "";
    const after = Number.parseInt(searchParams.get("after") || "0", 10) || 0;

    const data = await pollWatchTogetherRoom({
      roomId,
      afterCursor: after,
      participantId,
      nickname,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Polling failed", configured: true },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const action = body?.action || "";
  const roomId = getRoomId(body?.roomId);

  if (!roomId) {
    return badRequest("roomId is required");
  }

  if (!isRealtimeStoreConfigured()) {
    return serviceUnavailable("Watch Together realtime requires KV_REST_API_URL and KV_REST_API_TOKEN on Vercel.");
  }

  try {
    switch (action) {
      case "join-room": {
        const participantId = getParticipantId(body?.participantId);
        if (!participantId) {
          return badRequest("participantId is required");
        }

        const data = await joinWatchTogetherRoom({
          roomId,
          participantId,
          nickname: body?.nickname,
        });
        return NextResponse.json({ ...data, configured: true });
      }
      case "leave-room": {
        const participantId = getParticipantId(body?.participantId);
        if (!participantId) {
          return badRequest("participantId is required");
        }

        const data = await leaveWatchTogetherRoom({ roomId, participantId });
        return NextResponse.json({ ...data, configured: true });
      }
      case "heartbeat": {
        const participantId = getParticipantId(body?.participantId);
        if (!participantId) {
          return badRequest("participantId is required");
        }

        const snapshot = await heartbeatWatchTogetherRoom({
          roomId,
          participantId,
          nickname: body?.nickname,
        });
        return NextResponse.json({ snapshot, configured: true });
      }
      case "send-message": {
        const participantId = getParticipantId(body?.participantId);
        if (!participantId || !body?.message?.text) {
          return badRequest("participantId and message text are required");
        }

        const data = await sendWatchTogetherMessage({
          roomId,
          participantId,
          nickname: body?.nickname,
          message: body?.message,
        });
        return NextResponse.json({ ...data, configured: true });
      }
      case "sync-state": {
        const participantId = getParticipantId(body?.participantId);
        if (!participantId || !body?.state) {
          return badRequest("participantId and state are required");
        }

        const data = await updateWatchTogetherState({
          roomId,
          participantId,
          nickname: body?.nickname,
          state: body?.state,
        });
        return NextResponse.json({ ...data, configured: true });
      }
      case "sync-play": {
        const data = await triggerWatchTogetherSyncPlay({ roomId });
        return NextResponse.json({ ...data, configured: true });
      }
      default:
        return badRequest("Unsupported action");
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Realtime request failed", configured: true },
      { status: 500 },
    );
  }
}
