import { NextRequest, NextResponse } from "next/server";
import { runCascade, extractFromBlog } from "@/lib/extract";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    // direct blog URL mode (no cascade, just JSON-LD / page text)
    if (body.mode === "blog") {
      const result = await extractFromBlog(url);
      return NextResponse.json(result);
    }

    const result = await runCascade(url);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: "internal error", detail: String(e) },
      { status: 500 }
    );
  }
}
