function pickPreferredFormatUrl(formats = {}, preferredKeys = []) {
  for (const key of preferredKeys) {
    if (formats[key]) {
      return formats[key];
    }
  }

  for (const key of Object.keys(formats)) {
    if (preferredKeys.some((preferredKey) => key.startsWith(preferredKey))) {
      return formats[key];
    }
  }

  return null;
}

export function getGutendexTextUrl(formats = {}) {
  return pickPreferredFormatUrl(formats, [
    "text/plain; charset=utf-8",
    "text/plain; charset=us-ascii",
    "text/plain",
  ]);
}

export function getGutendexHtmlUrl(formats = {}) {
  return pickPreferredFormatUrl(formats, ["text/html"]);
}

export function normalizeGutendexBook(book) {
  const textUrl = getGutendexTextUrl(book.formats);
  const htmlUrl = getGutendexHtmlUrl(book.formats);

  return {
    workId: String(book.id),
    source: "gutendex",
    title: book.title,
    authors: (book.authors || []).map((author) => author.name),
    firstPublishYear: null,
    downloadCount: book.download_count || 0,
    coverUrl: book.formats?.["image/jpeg"] || null,
    subjects: [...(book.bookshelves || []), ...(book.subjects || [])].slice(0, 6),
    description: book.summaries?.[0] || "",
    canReadOnline: Boolean(textUrl || htmlUrl),
    textUrl,
    htmlUrl,
    epubUrl: pickPreferredFormatUrl(book.formats, ["application/epub+zip"]),
    sourceUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
    language: book.languages?.[0] || null,
    copyright: book.copyright,
    mediaType: book.media_type || "Text",
    readerStatus: textUrl
      ? "Free public-domain text"
      : htmlUrl
        ? "Free web reader"
        : "Metadata only",
  };
}

export function splitBookIntoPages(text, targetChars = 2600) {
  const normalized = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\uFEFF/g, "")
    .trim();

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return [normalized];
  }

  const pages = [];
  let currentPage = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    const paragraphLength = paragraph.length;

    if (currentLength > 0 && currentLength + paragraphLength > targetChars) {
      pages.push(currentPage.join("\n\n"));
      currentPage = [paragraph];
      currentLength = paragraphLength;
      continue;
    }

    currentPage.push(paragraph);
    currentLength += paragraphLength;
  }

  if (currentPage.length) {
    pages.push(currentPage.join("\n\n"));
  }

  return pages;
}