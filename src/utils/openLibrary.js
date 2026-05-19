async function ensureJson(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || fallbackMessage);
  }

  return payload;
}

async function ensureText(response, fallbackMessage) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || fallbackMessage);
  }

  return response.text();
}

export async function searchOpenLibraryBooks(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    page: String(options.page || 1),
    limit: String(options.limit || 12),
    mode: String(options.mode || "search"),
  });

  const response = await fetch(`/api/booklibrary/search?${params.toString()}`, {
    cache: "no-store",
  });

  return ensureJson(response, "Unable to search books right now.");
}

export async function getOpenLibraryBookDetails(workId) {
  const response = await fetch(`/api/booklibrary/${workId}`, {
    cache: "no-store",
  });

  return ensureJson(response, "Unable to load this book right now.");
}

export async function getBookReaderContent(workId) {
  const response = await fetch(`/api/booklibrary/${workId}/content`, {
    cache: "no-store",
  });

  return ensureText(response, "Unable to load reader text right now.");
}