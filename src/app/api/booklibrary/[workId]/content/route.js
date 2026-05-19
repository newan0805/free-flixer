import { NextResponse } from "next/server";
import { getGutendexHtmlUrl, getGutendexTextUrl } from "@utils/gutendex";

function normalizeWorkId(workId) {
  return String(workId || "").replace("/works/", "");
}

function cleanProjectGutenbergText(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const startPattern = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;
  const endPattern = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;

  let cleaned = normalized;
  const startMatch = cleaned.match(startPattern);
  if (startMatch?.index !== undefined) {
    cleaned = cleaned.slice(startMatch.index + startMatch[0].length);
  }

  const endMatch = cleaned.match(endPattern);
  if (endMatch?.index !== undefined) {
    cleaned = cleaned.slice(0, endMatch.index);
  }

  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function fetchRemoteText(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }

  return response.text();
}

export async function GET(_request, context) {
  const params = await context.params;
  const workId = normalizeWorkId(params?.workId);

  if (!workId) {
    return NextResponse.json({ error: "Invalid book id." }, { status: 400 });
  }

  try {
    const detailResponse = await fetch(`https://gutendex.com/books/${workId}`, {
      cache: "no-store",
    });

    if (!detailResponse.ok) {
      return NextResponse.json(
        { error: "Unable to load reader content." },
        { status: detailResponse.status }
      );
    }

    const book = await detailResponse.json();
    const textUrl = getGutendexTextUrl(book.formats);
    const htmlUrl = getGutendexHtmlUrl(book.formats);

    let content = "";

    if (textUrl) {
      content = cleanProjectGutenbergText(await fetchRemoteText(textUrl));
    } else if (htmlUrl) {
      content = stripHtml(await fetchRemoteText(htmlUrl));
    }

    if (!content) {
      return NextResponse.json(
        { error: "No free readable text is available for this book." },
        { status: 404 }
      );
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Book content failed:", error);
    return NextResponse.json(
      { error: "Unable to load reader content." },
      { status: 500 }
    );
  }
}