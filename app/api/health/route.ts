import { execSync } from "child_process";
import { NextResponse } from "next/server";

function checkBinary(name: string, flag = "--version"): string | null {
  try {
    return execSync(`${name} ${flag}`, { timeout: 5000 })
      .toString()
      .trim()
      .split("\n")[0];
  } catch {
    return null;
  }
}

export async function GET() {
  const ytdlp = checkBinary("yt-dlp");
  const ffmpegVersion = checkBinary("ffmpeg", "-version");

  return NextResponse.json({
    status: "ok",
    node: process.version,
    llm_provider: process.env.GEMINI_API_KEY ? "gemini" : "groq",
    llm_key_loaded: !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY),
    llm_model: process.env.GEMINI_API_KEY ? (process.env.GEMINI_MODEL || "gemini-2.5-flash") : (process.env.GROQ_MODEL || "llama-3.1-8b-instant"),
    ytdlp: ytdlp ? { installed: true, version: ytdlp } : { installed: false },
    ffmpeg: ffmpegVersion
      ? { installed: true, version: ffmpegVersion }
      : { installed: false },
  });
}
