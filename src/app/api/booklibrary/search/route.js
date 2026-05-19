import { NextResponse } from "next/server";
import { normalizeGutendexBook } from "@utils/gutendex";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const page = Number(searchParams.get("page") || 1);
  const limit = Math.min(Number(searchParams.get("limit") || 12), 24);
  const mode = searchParams.get("mode") || "search";

  if (!q) {
    return NextResponse.json(
      { error: "A search query is required." },
      { status: 400 }
    );
  }

  const upstreamParams = new URLSearchParams({
    page: String(page),
    copyright: "false",
    mime_type: "text/",
  });

  if (mode === "topic") {
    upstreamParams.set("topic", q);
  } else {
    upstreamParams.set("search", q);
  }

  try {
    const response = await fetch(
      `https://gutendex.com/books/?${upstreamParams.toString()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to reach the free book catalog." },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const startIndex = Math.max((page - 1) * limit, 0);
    const books = (payload.results || [])
      .map(normalizeGutendexBook)
      .filter((book) => book.canReadOnline)
      .slice(startIndex, startIndex + limit);

    return NextResponse.json({
      books,
      page,
      total: payload.count || 0,
      query: q,
      mode,
    });
  } catch (error) {
    console.error("Book search failed:", error);
    return NextResponse.json(
      { error: "Book search failed." },
      { status: 500 }
    );
  }
}