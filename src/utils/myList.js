// My List utility functions with local-first storage and Upstash sync.

const LIST_KEY_MAP = {
  myList: "myList",
  watchedItems: "watchedItems",
  toWatchLater: "toWatchLater",
};

const WATCH_PROGRESS_PREFIX = "watchProgress_";

function isBrowser() {
  return typeof globalThis !== "undefined" && typeof globalThis.window !== "undefined";
}

function readJson(key, fallback) {
  if (!isBrowser()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

async function postMyListAction(payload) {
  if (!isBrowser()) return null;

  const response = await fetch("/api/my-list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

function queueMyListAction(payload) {
  if (!isBrowser()) return;

  postMyListAction(payload).catch((error) => {
    console.warn("My List server sync failed (local save kept):", error);
  });
}

function readList(storageKey) {
  const list = readJson(storageKey, []);
  return Array.isArray(list) ? list : [];
}

function writeList(storageKey, list) {
  writeJson(storageKey, list);
}

function getWatchProgressStorage() {
  if (!isBrowser()) return {};

  const progressData = {};

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(WATCH_PROGRESS_PREFIX)) {
        continue;
      }

      const tvId = key.slice(WATCH_PROGRESS_PREFIX.length);
      const value = localStorage.getItem(key);
      if (!value) continue;

      progressData[tvId] = JSON.parse(value);
    }
  } catch (error) {
    console.error("Error reading all watch progress:", error);
  }

  return progressData;
}

function applyServerPayload(lists) {
  if (!isBrowser() || !lists || typeof lists !== "object") return;

  Object.values(LIST_KEY_MAP).forEach((key) => {
    const value = Array.isArray(lists[key]) ? lists[key] : [];
    writeList(key, value);
  });

  const watchProgress = lists.watchProgress && typeof lists.watchProgress === "object"
    ? lists.watchProgress
    : {};

  Object.keys(getWatchProgressStorage()).forEach((tvId) => {
    localStorage.removeItem(`${WATCH_PROGRESS_PREFIX}${tvId}`);
  });

  Object.entries(watchProgress).forEach(([tvId, progress]) => {
    writeJson(`${WATCH_PROGRESS_PREFIX}${tvId}`, progress);
  });
}

function buildSyncPayload() {
  return {
    myList: readList(LIST_KEY_MAP.myList),
    watchedItems: readList(LIST_KEY_MAP.watchedItems),
    toWatchLater: readList(LIST_KEY_MAP.toWatchLater),
    watchProgress: getWatchProgressStorage(),
  };
}

export const myList = {
  // Pull latest list state from server and cache in localStorage.
  async hydrateFromServer() {
    if (!isBrowser()) return { configured: false, lists: null };

    try {
      const response = await fetch("/api/my-list", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return { configured: false, lists: null };
      }

      const data = await response.json();
      if (data?.configured && data?.lists) {
        applyServerPayload(data.lists);
      }

      return {
        configured: Boolean(data?.configured),
        lists: data?.lists || null,
      };
    } catch (error) {
      console.warn("My List hydrate failed, using local cache:", error);
      return { configured: false, lists: null };
    }
  },

  // Send full local snapshot to server.
  syncAllToServer() {
    queueMyListAction({
      action: "sync-all",
      payload: buildSyncPayload(),
    });
  },

  // Get all items from My List
  getItems() {
    return readList(LIST_KEY_MAP.myList);
  },

  // Add item to My List
  addItem(item) {
    const currentItems = this.getItems();
    const exists = currentItems.some((entry) => entry.id === item.id && entry.type === item.type);

    if (!exists) {
      const itemWithMeta = {
        ...item,
        addedAt: Date.now(),
      };
      const updatedItems = [...currentItems, itemWithMeta];
      writeList(LIST_KEY_MAP.myList, updatedItems);

      queueMyListAction({
        action: "upsert-item",
        listKey: LIST_KEY_MAP.myList,
        item: itemWithMeta,
      });
    }
  },

  // Remove item from My List
  removeItem(id, type) {
    const currentItems = this.getItems();
    const updatedItems = currentItems.filter((item) => !(item.id === id && item.type === type));
    writeList(LIST_KEY_MAP.myList, updatedItems);

    queueMyListAction({
      action: "remove-item",
      listKey: LIST_KEY_MAP.myList,
      id,
      type,
    });
  },

  // Check if item is in My List
  isInList(id, type) {
    const currentItems = this.getItems();
    return currentItems.some((item) => item.id === id && item.type === type);
  },

  // Clear all items from My List
  clearList() {
    if (!isBrowser()) return;

    try {
      localStorage.removeItem(LIST_KEY_MAP.myList);
      queueMyListAction({
        action: "clear-list",
        listKey: LIST_KEY_MAP.myList,
      });
    } catch (error) {
      console.error("Error clearing My List:", error);
    }
  },

  // Get watched items
  getWatchedItems() {
    return readList(LIST_KEY_MAP.watchedItems);
  },

  // Add item to watched list
  addWatchedItem(item) {
    const watchedItems = this.getWatchedItems();
    const exists = watchedItems.some((entry) => entry.id === item.id && entry.type === item.type);

    if (!exists) {
      const itemWithMeta = {
        ...item,
        addedAt: Date.now(),
      };
      const updatedItems = [...watchedItems, itemWithMeta];
      writeList(LIST_KEY_MAP.watchedItems, updatedItems);

      queueMyListAction({
        action: "upsert-item",
        listKey: LIST_KEY_MAP.watchedItems,
        item: itemWithMeta,
      });
    }
  },

  // Remove item from watched list
  removeWatchedItem(id, type) {
    const watchedItems = this.getWatchedItems();
    const updatedItems = watchedItems.filter((item) => !(item.id === id && item.type === type));
    writeList(LIST_KEY_MAP.watchedItems, updatedItems);

    queueMyListAction({
      action: "remove-item",
      listKey: LIST_KEY_MAP.watchedItems,
      id,
      type,
    });
  },

  // Check if item is watched
  isWatched(id, type) {
    const watchedItems = this.getWatchedItems();
    return watchedItems.some((item) => item.id === id && item.type === type);
  },

  // Get to watch later items
  getToWatchLaterItems() {
    return readList(LIST_KEY_MAP.toWatchLater);
  },

  // Add item to to watch later list
  addToWatchLater(item) {
    const toWatchLaterItems = this.getToWatchLaterItems();
    const exists = toWatchLaterItems.some((entry) => entry.id === item.id && entry.type === item.type);

    if (!exists) {
      const itemWithMeta = {
        ...item,
        addedAt: Date.now(),
      };
      const updatedItems = [...toWatchLaterItems, itemWithMeta];
      writeList(LIST_KEY_MAP.toWatchLater, updatedItems);

      queueMyListAction({
        action: "upsert-item",
        listKey: LIST_KEY_MAP.toWatchLater,
        item: itemWithMeta,
      });
    }
  },

  // Remove item from to watch later list
  removeFromToWatchLater(id, type) {
    const toWatchLaterItems = this.getToWatchLaterItems();
    const updatedItems = toWatchLaterItems.filter((item) => !(item.id === id && item.type === type));
    writeList(LIST_KEY_MAP.toWatchLater, updatedItems);

    queueMyListAction({
      action: "remove-item",
      listKey: LIST_KEY_MAP.toWatchLater,
      id,
      type,
    });
  },

  // Check if item is in to watch later
  isInToWatchLater(id, type) {
    const toWatchLaterItems = this.getToWatchLaterItems();
    return toWatchLaterItems.some((item) => item.id === id && item.type === type);
  },

  // Clear all lists
  clearAll() {
    if (!isBrowser()) return;

    try {
      localStorage.removeItem(LIST_KEY_MAP.myList);
      localStorage.removeItem(LIST_KEY_MAP.watchedItems);
      localStorage.removeItem(LIST_KEY_MAP.toWatchLater);

      Object.keys(getWatchProgressStorage()).forEach((tvId) => {
        localStorage.removeItem(`${WATCH_PROGRESS_PREFIX}${tvId}`);
      });

      queueMyListAction({ action: "clear-all" });
    } catch (error) {
      console.error("Error clearing all lists:", error);
    }
  },

  // Get watch progress for TV shows
  getWatchProgress(tvId) {
    return readJson(`${WATCH_PROGRESS_PREFIX}${tvId}`, null);
  },

  // Save watch progress for TV shows
  saveWatchProgress(tvId, season, episode) {
    const progress = {
      season,
      episode,
      timestamp: Date.now(),
    };

    writeJson(`${WATCH_PROGRESS_PREFIX}${tvId}`, progress);

    queueMyListAction({
      action: "save-progress",
      tvId,
      season,
      episode,
    });
  },

  // Clear watch progress for TV shows
  clearWatchProgress(tvId) {
    if (!isBrowser()) return;

    try {
      localStorage.removeItem(`${WATCH_PROGRESS_PREFIX}${tvId}`);
      queueMyListAction({
        action: "clear-progress",
        tvId,
      });
    } catch (error) {
      console.error("Error clearing watch progress:", error);
    }
  },

  // Get all watch progress data
  getAllWatchProgress() {
    return getWatchProgressStorage();
  },
};
