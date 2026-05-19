"use client";

import Image from "next/image";

const fallbackCover =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="320" height="480" rx="24" fill="url(#g)" />
      <path d="M82 96h156a18 18 0 0 1 18 18v252a18 18 0 0 1-18 18H82a18 18 0 0 1-18-18V114a18 18 0 0 1 18-18Z" fill="none" stroke="#f8fafc" stroke-opacity="0.15" stroke-width="12"/>
      <path d="M108 158h104M108 202h104M108 246h80" stroke="#f8fafc" stroke-opacity="0.35" stroke-width="12" stroke-linecap="round"/>
      <circle cx="235" cy="349" r="18" fill="#f59e0b" fill-opacity="0.8"/>
    </svg>
  `);

function formatAuthors(authors) {
  if (!authors?.length) return "Unknown author";
  return authors.slice(0, 2).join(", ");
}

function formatSecondaryMeta(book) {
  if (book.downloadCount) {
    return `${new Intl.NumberFormat("en").format(book.downloadCount)} downloads`;
  }

  if (book.firstPublishYear) {
    return String(book.firstPublishYear);
  }

  return book.language ? book.language.toUpperCase() : "Free edition";
}

export default function BookCard({
  book,
  isSaved,
  onToggleSave,
  onRead,
  actionLabel,
}) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={book.coverUrl || fallbackCover}
          alt={book.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={book.coverUrl?.startsWith("data:")}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300 backdrop-blur-md">
            {book.canReadOnline ? "Free Read" : "Details"}
          </span>
          {book.progress?.currentPage ? (
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200 backdrop-blur-md">
              Page {book.progress.currentPage}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold text-white">{book.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{formatAuthors(book.authors)}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
            {formatSecondaryMeta(book)}
          </p>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-400">
          {book.description || "Open the book to read free public-domain text and keep your place locally in this browser."}
        </p>

        {book.subjects?.length ? (
          <div className="flex flex-wrap gap-2">
            {book.subjects.slice(0, 3).map((subject) => (
              <span
                key={subject}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300"
              >
                {subject}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onRead(book)}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
          >
            {actionLabel || (book.progress ? "Resume Reading" : "Read Book")}
          </button>
          <button
            type="button"
            onClick={() => onToggleSave(book)}
            className={`inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-colors ${
              isSaved
                ? "border-red-400/50 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                : "border-white/15 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {isSaved ? "Remove" : "Save"}
          </button>
        </div>
      </div>
    </article>
  );
}