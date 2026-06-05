import { NextRequest, NextResponse } from "next/server";
import { runCascade, extractFromBlog } from "@/lib/extract";

const EXTRACT_API_URL = process.env.EXTRACT_API_URL; // e.g. http://ec2-xx-xx-xx-xx.compute.amazonaws.com:4000

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

    // If external extract API is configured, proxy to it (for Vercel deployment)
    if (EXTRACT_API_URL) {
      try {
        const r = await fetch(`${EXTRACT_API_URL}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, mode: body.mode }),
        });
        const data = await r.json();
        return NextResponse.json(data, { status: r.status });
      } catch (e) {
        // If external API is down, fall through to local extraction
        console.error("External extract API error, falling back to local:", e);
      }
    }

    // Local extraction (works fully when running locally with yt-dlp/ffmpeg)
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
