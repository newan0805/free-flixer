import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const USER_COOKIE = "ff_uid";
const LISTS_KEY_PREFIX = "ff:user:";
const LISTS_KEY_SUFFIX = ":lists";
const LIST_TTL_SECONDS = 60 * 60 * 24 * 90;
const LIST_KEYS = ["myList", "watchedItems", "toWatchLater"];

export const runtime = "nodejs";

function getEnvValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }

  return "";
}

function getRedisConfig() {
  const url = getEnvValue("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL");
  const token = getEnvValue("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN");
  return {
    url,
    token,
    enabled: Boolean(url && token),
  };
}

async function runRedisPipeline(commands) {
  const { url, token, enabled } = getRedisConfig();
  if (!enabled) {
    throw new Error("Upstash Redis is not configured");
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
    throw new Error(await response.text());
  }

  const data = await response.json();
  data.forEach((entry) => {
    if (entry?.error) {
      throw new Error(entry.error);
    }
  });

  return data.map((entry) => entry?.result);
}

function sanitizeArrayItems(items) {
  if (!Array.isArray(items)) return [];

  return items.slice(0, 1500).map((item) => ({
    ...item,
    id: String(item?.id ?? "").slice(0, 64),
    type: String(item?.type ?? "").slice(0, 32),
    addedAt: Number(item?.addedAt || Date.now()),
  })).filter((item) => item.id && item.type);
}

function sanitizeProgress(progressMap) {
  const next = {};
  if (!progressMap || typeof progressMap !== "object") return next;

  Object.entries(progressMap).slice(0, 2000).forEach(([tvId, progress]) => {
    next[String(tvId).slice(0, 64)] = {
      season: Number(progress?.season || 1),
      episode: Number(progress?.episode || 1),
      timestamp: Number(progress?.timestamp || Date.now()),
    };
  });

  return next;
}

function createDefaultLists() {
  return {
    myList: [],
    watchedItems: [],
    toWatchLater: [],
    watchProgress: {},
  };
}

function normalizeListsPayload(payload) {
  const base = createDefaultLists();

  LIST_KEYS.forEach((key) => {
    base[key] = sanitizeArrayItems(payload?.[key]);
  });

  base.watchProgress = sanitizeProgress(payload?.watchProgress);
  return base;
}

function getRedisListKey(uid) {
  return `${LISTS_KEY_PREFIX}${uid}${LISTS_KEY_SUFFIX}`;
}

async function loadUserLists(uid) {
  const key = getRedisListKey(uid);
  const [raw] = await runRedisPipeline([["GET", key]]);

  if (!raw) return createDefaultLists();

  try {
    return normalizeListsPayload(JSON.parse(raw));
  } catch {
    return createDefaultLists();
  }
}

async function saveUserLists(uid, payload) {
  const key = getRedisListKey(uid);
  const normalized = normalizeListsPayload(payload);

  await runRedisPipeline([
    ["SET", key, JSON.stringify(normalized), "EX", LIST_TTL_SECONDS],
  ]);

  return normalized;
}

async function getOrCreateUserId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(USER_COOKIE)?.value;
  if (existing) return { uid: existing, shouldSetCookie: false };

  return {
    uid: globalThis.crypto.randomUUID(),
    shouldSetCookie: true,
  };
}

function withUserCookie(response, uid, shouldSetCookie) {
  if (!shouldSetCookie) return response;

  response.cookies.set(USER_COOKIE, uid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LIST_TTL_SECONDS,
  });

  return response;
}

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const { enabled } = getRedisConfig();
  if (!enabled) {
    return NextResponse.json({
      configured: false,
      lists: createDefaultLists(),
      message: "Upstash Redis is not configured.",
    }, { status: 503 });
  }

  try {
    const { uid, shouldSetCookie } = await getOrCreateUserId();
    const lists = await loadUserLists(uid);
    const response = NextResponse.json({ configured: true, lists });
    return withUserCookie(response, uid, shouldSetCookie);
  } catch (error) {
    return NextResponse.json({
      configured: true,
      error: error instanceof Error ? error.message : "Failed to load my lists",
    }, { status: 500 });
  }
}

export async function POST(request) {
  const { enabled } = getRedisConfig();
  if (!enabled) {
    return NextResponse.json({
      configured: false,
      message: "Upstash Redis is not configured.",
    }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body?.action) {
      return badRequest("action is required");
    }

    const { uid, shouldSetCookie } = await getOrCreateUserId();
    const lists = await loadUserLists(uid);

    switch (body.action) {
      case "upsert-item": {
        const listKey = String(body.listKey || "");
        if (!LIST_KEYS.includes(listKey)) {
          return badRequest("Invalid listKey");
        }

        const item = sanitizeArrayItems([{ ...body.item, addedAt: Date.now() }])[0];
        if (!item) {
          return badRequest("Invalid item payload");
        }

        const nextItems = lists[listKey].filter((entry) => !(entry.id === item.id && entry.type === item.type));
        lists[listKey] = [...nextItems, item];
        break;
      }
      case "remove-item": {
        const listKey = String(body.listKey || "");
        if (!LIST_KEYS.includes(listKey)) {
          return badRequest("Invalid listKey");
        }

        const id = String(body.id || "").slice(0, 64);
        const type = String(body.type || "").slice(0, 32);
        lists[listKey] = lists[listKey].filter((entry) => !(entry.id === id && entry.type === type));
        break;
      }
      case "clear-list": {
        const listKey = String(body.listKey || "");
        if (!LIST_KEYS.includes(listKey)) {
          return badRequest("Invalid listKey");
        }

        lists[listKey] = [];
        break;
      }
      case "clear-all": {
        LIST_KEYS.forEach((key) => {
          lists[key] = [];
        });
        lists.watchProgress = {};
        break;
      }
      case "save-progress": {
        const tvId = String(body.tvId || "").slice(0, 64);
        if (!tvId) {
          return badRequest("tvId is required");
        }

        lists.watchProgress[tvId] = {
          season: Number(body.season || 1),
          episode: Number(body.episode || 1),
          timestamp: Date.now(),
        };
        break;
      }
      case "clear-progress": {
        const tvId = String(body.tvId || "").slice(0, 64);
        if (!tvId) {
          return badRequest("tvId is required");
        }

        delete lists.watchProgress[tvId];
        break;
      }
      case "sync-all": {
        const nextLists = normalizeListsPayload(body.payload || {});
        LIST_KEYS.forEach((key) => {
          lists[key] = nextLists[key];
        });
        lists.watchProgress = nextLists.watchProgress;
        break;
      }
      default:
        return badRequest("Unsupported action");
    }

    const saved = await saveUserLists(uid, lists);
    const response = NextResponse.json({ configured: true, lists: saved });
    return withUserCookie(response, uid, shouldSetCookie);
  } catch (error) {
    return NextResponse.json({
      configured: true,
      error: error instanceof Error ? error.message : "Failed to update my lists",
    }, { status: 500 });
  }
}
