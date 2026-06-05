import { NextRequest, NextResponse } from "next/server";
import { runCascade, extractFromBlog } from "@/lib/extract";

const EXTRACT_API_URL = process.env.EXTRACT_API_URL;

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

    if (body.mode === "blog") {
      const result = await extractFromBlog(url);
      return NextResponse.json(result);
    }

    // Run cascade locally first (caption + blog work on Vercel)
    const result = await runCascade(url);

    // If local cascade got a result (caption or blog), return it
    if (result.stage !== "fallback") {
      return NextResponse.json(result);
    }

    // Local cascade fell through to fallback (needed audio but no yt-dlp on Vercel)
    // Try EC2 backend which has yt-dlp + ffmpeg for audio transcription
    if (EXTRACT_API_URL) {
      try {
        const r = await fetch(`${EXTRACT_API_URL}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const ec2Result = await r.json();
        // Only use EC2 result if it found something better than fallback
        if (ec2Result.stage && ec2Result.stage !== "fallback") {
          return NextResponse.json(ec2Result);
        }
      } catch (e) {
        console.error("EC2 extract API error:", e);
      }
    }

    // Return the local fallback result
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: "internal error", detail: String(e) },
      { status: 500 }
    );
  }
}
