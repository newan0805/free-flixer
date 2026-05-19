import { NextResponse } from "next/server";
import { normalizeGutendexBook } from "@utils/gutendex";

function normalizeWorkId(workId) {
  return String(workId || "").replace("/works/", "");
}

export async function GET(_request, context) {
  const params = await context.params;
  const workId = normalizeWorkId(params?.workId);

  if (!workId) {
    return NextResponse.json({ error: "Invalid work id." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://gutendex.com/books/${workId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load book details." },
        { status: response.status }
      );
    }

    const payload = await response.json();
    const book = normalizeGutendexBook(payload);

    return NextResponse.json({
      book,
    });
  } catch (error) {
    console.error("Book details failed:", error);
    return NextResponse.json(
      { error: "Unable to load book details." },
      { status: 500 }
    );
  }
}