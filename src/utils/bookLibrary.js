const BOOK_LIBRARY_KEY = "bookLibrary_v2_items";
const BOOK_PROGRESS_KEY = "bookLibrary_v2_progress";

function isBrowser() {
  return typeof window !== "undefined";
}

function readStorage(key, fallback) {
  if (!isBrowser()) return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading storage key ${key}:`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing storage key ${key}:`, error);
  }
}

function normalizeWorkId(workId) {
  return String(workId || "").replace("/works/", "").trim();
}

export const bookLibrary = {
  getBooks() {
    return readStorage(BOOK_LIBRARY_KEY, []);
  },

  getBook(workId) {
    const normalizedWorkId = normalizeWorkId(workId);
    return this.getBooks().find((book) => book.workId === normalizedWorkId) || null;
  },

  saveBook(book) {
    if (!isBrowser() || !book?.workId) return;

    const normalizedBook = {
      ...book,
      source: book.source || "gutendex",
      workId: normalizeWorkId(book.workId),
      savedAt: book.savedAt || Date.now(),
      updatedAt: Date.now(),
    };

    const currentBooks = this.getBooks();
    const nextBooks = currentBooks.filter(
      (item) => item.workId !== normalizedBook.workId
    );

    writeStorage(BOOK_LIBRARY_KEY, [normalizedBook, ...nextBooks]);
  },

  removeBook(workId) {
    if (!isBrowser()) return;

    const normalizedWorkId = normalizeWorkId(workId);
    const nextBooks = this.getBooks().filter((book) => book.workId !== normalizedWorkId);
    writeStorage(BOOK_LIBRARY_KEY, nextBooks);
  },

  isSaved(workId) {
    return Boolean(this.getBook(workId));
  },

  getProgress(workId) {
    const progressMap = readStorage(BOOK_PROGRESS_KEY, {});
    return progressMap[normalizeWorkId(workId)] || null;
  },

  saveProgress(workId, progress, book) {
    if (!isBrowser()) return;

    const normalizedWorkId = normalizeWorkId(workId);
    const currentProgress = readStorage(BOOK_PROGRESS_KEY, {});
    const nextProgress = {
      ...currentProgress,
      [normalizedWorkId]: {
        ...currentProgress[normalizedWorkId],
        ...progress,
        workId: normalizedWorkId,
        lastReadAt: Date.now(),
      },
    };

    writeStorage(BOOK_PROGRESS_KEY, nextProgress);

    if (book) {
      this.saveBook({
        ...book,
        workId: normalizedWorkId,
      });
    }
  },

  clearProgress(workId) {
    if (!isBrowser()) return;

    const normalizedWorkId = normalizeWorkId(workId);
    const currentProgress = readStorage(BOOK_PROGRESS_KEY, {});
    const rest = { ...currentProgress };
    delete rest[normalizedWorkId];
    writeStorage(BOOK_PROGRESS_KEY, rest);
  },

  getContinueReading() {
    const books = this.getBooks();
    const progressMap = readStorage(BOOK_PROGRESS_KEY, {});

    return books
      .map((book) => ({
        ...book,
        progress: progressMap[book.workId] || null,
      }))
      .filter((book) => book.progress)
      .sort((left, right) => {
        const leftTime = left.progress?.lastReadAt || 0;
        const rightTime = right.progress?.lastReadAt || 0;
        return rightTime - leftTime;
      });
  },
};