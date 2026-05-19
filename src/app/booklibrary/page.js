"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BookCard from "@components/BookCard";
import { bookLibrary } from "@utils/bookLibrary";
import { searchOpenLibraryBooks } from "@utils/openLibrary";

const discoverShelves = [
  { label: "Classics", query: "classics" },
  { label: "Adventure", query: "adventure" },
  { label: "Mystery", query: "mystery" },
  { label: "Romance", query: "romance" },
  { label: "Science Fiction", query: "science fiction" },
];

function formatTimestamp(value) {
  if (!value) return "Not started";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function BookLibraryPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState(discoverShelves[0].query);
  const [activeMode, setActiveMode] = useState("topic");
  const [books, setBooks] = useState([]);
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [continueReading, setContinueReading] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const savedIds = useMemo(
    () => new Set(libraryBooks.map((book) => book.workId)),
    [libraryBooks]
  );

  const refreshLocalState = () => {
    setLibraryBooks(bookLibrary.getBooks());
    setContinueReading(bookLibrary.getContinueReading());
  };

  const loadShelf = async (searchTerm, mode) => {
    try {
      setLoading(true);
      setError("");
      const payload = await searchOpenLibraryBooks(searchTerm, {
        limit: 12,
        mode,
      });
      setBooks(payload.books || []);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load books right now.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLocalState();
    loadShelf(activeQuery, activeMode);
  }, [activeMode, activeQuery]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setActiveMode("search");
    setActiveQuery(query.trim());
  };

  const handleToggleSave = (book) => {
    if (bookLibrary.isSaved(book.workId)) {
      bookLibrary.removeBook(book.workId);
    } else {
      bookLibrary.saveBook(book);
    }

    refreshLocalState();
  };

  const handleRead = (book) => {
    if (!bookLibrary.isSaved(book.workId)) {
      bookLibrary.saveBook(book);
    }

    router.push(`/booklibrary/read/${book.workId}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_30%),linear-gradient(180deg,_#020617,_#08111f_45%,_#020617)] pb-16">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Newest Feature
          </span>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
                Free reading library built on Gutendex and Project Gutenberg.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Search public-domain books with real readable text, save them locally, and jump back into the reader from the exact page marker and notes you saved last time.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search books, authors, or subjects"
                  className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-amber-300"
                >
                  Search Library
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {discoverShelves.map((shelf) => (
                  <button
                    key={shelf.label}
                    type="button"
                    onClick={() => {
                      setActiveMode("topic");
                      setActiveQuery(shelf.query);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      activeMode === "topic" && activeQuery === shelf.query
                        ? "bg-white text-slate-950"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {shelf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-6 backdrop-blur-md">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Local Features
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-3xl font-bold text-white">{libraryBooks.length}</p>
                  <p className="text-sm text-slate-400">saved books in your browser library</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{continueReading.length}</p>
                  <p className="text-sm text-slate-400">books ready to resume from your saved spot</p>
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Reading progress is stored in local storage, so your library, page marker, and reading notes stay on this device even after refresh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {continueReading.length ? (
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Continue Reading</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Pick up where you stopped</h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {continueReading.slice(0, 3).map((book) => (
                <div
                  key={book.workId}
                  className="rounded-[1.5rem] border border-blue-400/20 bg-blue-500/5 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-blue-200">Saved Spot</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{book.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{(book.authors || []).join(", ")}</p>
                    </div>
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
                      Page {book.progress?.currentPage || 1}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-400">
                    Last updated {formatTimestamp(book.progress?.lastReadAt)}
                  </p>
                  {book.progress?.note ? (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-300">{book.progress.note}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleRead(book)}
                    className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
                  >
                    Resume Reading
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Your Library</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Saved books</h2>
            </div>
          </div>

          {libraryBooks.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {libraryBooks.map((book) => (
                <BookCard
                  key={book.workId}
                  book={{ ...book, progress: bookLibrary.getProgress(book.workId) }}
                  isSaved={savedIds.has(book.workId)}
                  onToggleSave={handleToggleSave}
                  onRead={handleRead}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/5 p-8 text-center text-slate-400">
              Your saved library is empty. Search below and save books to keep them locally in this browser.
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Discover</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {activeMode === "search" && query.trim() && activeQuery === query.trim()
                  ? `Search results for “${query.trim()}”`
                  : "Free readable picks from Project Gutenberg"}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/5] animate-pulse rounded-[1.5rem] bg-slate-800/70"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/5 p-6 text-red-200">
              {error}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <BookCard
                  key={book.workId}
                  book={book}
                  isSaved={savedIds.has(book.workId)}
                  onToggleSave={handleToggleSave}
                  onRead={handleRead}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}