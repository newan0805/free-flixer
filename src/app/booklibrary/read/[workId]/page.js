"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { bookLibrary } from "@utils/bookLibrary";
import {
  getBookReaderContent,
  getOpenLibraryBookDetails,
} from "@utils/openLibrary";
import { splitBookIntoPages } from "@utils/gutendex";

function formatLastSaved(value) {
  if (!value) return "Not saved yet";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function BookReaderPage() {
  const params = useParams();
  const workId = String(params.workId || "");
  const [book, setBook] = useState(null);
  const [readerText, setReaderText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageMarker, setPageMarker] = useState(1);
  const [note, setNote] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  const pages = useMemo(() => splitBookIntoPages(readerText), [readerText]);
  const totalPages = pages.length;
  const currentPage = Math.min(Math.max(Number(pageMarker) || 1, 1), Math.max(totalPages, 1));

  useEffect(() => {
    let ignore = false;

    const loadBook = async () => {
      try {
        setIsLoading(true);
        setError("");

        const localBook = bookLibrary.getBook(workId);
        const localProgress = bookLibrary.getProgress(workId);

        if (!ignore && localProgress) {
          setPageMarker(localProgress.currentPage || 1);
          setNote(localProgress.note || "");
          setSavedAt(localProgress.lastReadAt || null);
        }

        if (!ignore && localBook) {
          setBook({ ...localBook, progress: localProgress });
        }

        const [payload, text] = await Promise.all([
          getOpenLibraryBookDetails(workId),
          getBookReaderContent(workId).catch(() => ""),
        ]);

        if (ignore) return;

        const mergedBook = {
          ...localBook,
          ...payload.book,
          progress: localProgress,
        };

        setBook(mergedBook);
        setReaderText(text);

        if (localBook || localProgress) {
          bookLibrary.saveBook(mergedBook);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!ignore) {
          setError("Unable to load this book.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadBook();

    return () => {
      ignore = true;
    };
  }, [workId]);

  useEffect(() => {
    if (!totalPages) return;
    if (Number(pageMarker) > totalPages) {
      setPageMarker(totalPages);
    }
  }, [pageMarker, totalPages]);

  useEffect(() => {
    if (!book) return;

    const timeoutId = window.setTimeout(() => {
      bookLibrary.saveProgress(
        workId,
        {
          currentPage,
          note,
        },
        book
      );
      setSavedAt(Date.now());
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [book, currentPage, note, workId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-b-2 border-amber-400" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/5 p-8 text-red-200">
          {error || "Book not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#020617,_#081120_45%,_#020617)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-md">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-[1.25rem] border border-white/10">
            <Image
              src={book.coverUrl || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
              alt={book.title}
              fill
              className="object-cover"
              sizes="240px"
              unoptimized={!book.coverUrl}
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Reader</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{book.title}</h1>
            <p className="mt-2 text-sm text-slate-300">{(book.authors || []).join(", ")}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              {book.description || "Project Gutenberg did not return a summary for this title."}
            </p>
          </div>

          <div className="space-y-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Page marker
              </label>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageMarker((value) => Math.max(1, Number(value || 1) - 1))}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(totalPages, 1)}
                  value={currentPage}
                  onChange={(event) => setPageMarker(Math.max(1, Number(event.target.value) || 1))}
                  className="w-full rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-white focus:border-amber-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPageMarker((value) => Math.min(Math.max(totalPages, 1), Number(value || 1) + 1))}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Reading note
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Leave yourself a note about where you stopped or what to pick up next."
                className="mt-2 w-full rounded-[1rem] border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600 focus:border-amber-300 focus:outline-none"
              />
            </div>

            <p className="text-sm text-slate-400">Local save updated {formatLastSaved(savedAt)}</p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={book.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Open on Project Gutenberg
            </a>
            {book.epubUrl ? (
              <a
                href={book.epubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition-colors hover:bg-amber-300"
              >
                Download EPUB
              </a>
            ) : null}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reading Session</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {book.readerStatus || (totalPages ? "Free public-domain text" : "Reader unavailable")}
              </h2>
            </div>
            <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
              {totalPages ? `Page ${currentPage} of ${totalPages}` : `Resume from page ${currentPage}`}
            </div>
          </div>

          {totalPages ? (
            <div className="flex min-h-[78vh] flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-sm text-slate-400">
                <button
                  type="button"
                  onClick={() => setPageMarker((value) => Math.max(1, Number(value || 1) - 1))}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage <= 1}
                >
                  Previous
                </button>
                <span>Saved locally on page {currentPage}</span>
                <button
                  type="button"
                  onClick={() => setPageMarker((value) => Math.min(totalPages, Number(value || 1) + 1))}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>

              <article className="flex-1 overflow-y-auto px-8 py-10">
                <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
                  <div className="mb-8 border-b border-white/10 pb-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-300">In-app Reader</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{book.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{(book.authors || []).join(", ")}</p>
                  </div>

                  <div className="space-y-5 text-base leading-8 text-slate-200">
                    {pages[currentPage - 1].split(/\n\n/).map((paragraph, index) => (
                      <p key={`${currentPage}-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          ) : (
            <div className="flex h-[78vh] items-center justify-center px-8 text-center">
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold text-white">No free reader text was returned</h3>
                <p className="mt-4 text-slate-300">
                  This title does not currently expose readable public-domain text through Gutendex or Project Gutenberg. Your book is still saved locally, and the page marker and note will be preserved if a readable text source is available later.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}