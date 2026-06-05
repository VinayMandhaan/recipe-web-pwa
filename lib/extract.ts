import { execSync } from "child_process";
import * as cheerio from "cheerio";
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const GROQ_KEY = () => process.env.GROQ_API_KEY || "";
const GROQ_MODEL = () => process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// ---- types ----

export interface RecipeResult {
  is_recipe: boolean;
  dish: string;
  ingredients: string[];
  steps: string[];
  confidence: "high" | "medium" | "low";
  note?: string;
}

export interface CascadeResponse {
  url: string;
  platform: string | null;
  caption: string;
  caption_ok: boolean;
  reason: string | null;
  stage: "caption" | "blog" | "transcript" | "fallback";
  result: RecipeResult | null;
  message?: string;
  debug?: Record<string, unknown>;
}

// ---- caption scraping ----

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function resolveRedirect(u: string): Promise<string> {
  try {
    const r = await fetch(u, {
      redirect: "follow",
      headers: { "User-Agent": UA },
    });
    return r.url || u;
  } catch {
    return u;
  }
}

async function getTikTok(
  url: string
): Promise<{ ok: boolean; caption: string; reason: string | null }> {
  const canonical = url.includes("/video/")
    ? url
    : await resolveRedirect(url);
  const r = await fetch(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonical)}`,
    { headers: { "User-Agent": UA } }
  );
  if (!r.ok) return { ok: false, caption: "", reason: `oembed HTTP ${r.status}` };
  const d = await r.json();
  return {
    ok: !!d.title,
    caption: d.title || "",
    reason: d.title ? null : "empty caption",
  };
}

async function getInstagram(
  url: string
): Promise<{ ok: boolean; caption: string; reason: string | null }> {
  const r = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  const html = await r.text();
  const $ = cheerio.load(html);
  const ogDesc =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="og:description"]').attr("content");

  if (ogDesc) return { ok: true, caption: decode(ogDesc), reason: null };

  const walled = /loginForm|"login_|please wait|challenge/i.test(html);
  return {
    ok: false,
    caption: "",
    reason: walled
      ? "WALLED (datacenter-IP block) - run on home wifi or use a paid scraper"
      : `no og:description (HTTP ${r.status})`,
  };
}

async function getCaption(url: string) {
  if (/tiktok\.com/i.test(url))
    return { platform: "tiktok" as const, ...(await getTikTok(url)) };
  if (/instagram\.com/i.test(url))
    return { platform: "instagram" as const, ...(await getInstagram(url)) };
  return {
    platform: null,
    ok: false,
    caption: "",
    reason: "paste a tiktok.com or instagram.com link",
  };
}

// ---- Groq LLM extraction ----

async function groqExtract(
  text: string
): Promise<{ parsed?: RecipeResult; error?: string; skipped?: string }> {
  const key = GROQ_KEY();
  if (!key) return { skipped: "no GROQ_API_KEY" };

  const prompt =
    "Parse this cooking content. Return ONLY JSON, no markdown: " +
    '{"is_recipe":bool,"dish":str,"ingredients":[str],"steps":[str],"confidence":"high"|"medium"|"low","note":str}. ' +
    "IMPORTANT: All output must be in English. Translate any Hindi, Urdu, or other non-English text to English. " +
    "If no real recipe, is_recipe=false.\n\n" +
    text.slice(0, 8000);

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL(),
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });
    const d = await r.json();
    if (d.error) return { error: d.error.message || JSON.stringify(d.error) };
    return { parsed: JSON.parse(d.choices[0].message.content) };
  } catch (e) {
    return { error: String(e) };
  }
}

function isGood(ex: { parsed?: RecipeResult }): boolean {
  return (
    !!ex?.parsed?.is_recipe &&
    ex.parsed.confidence !== "low" &&
    (ex.parsed.ingredients || []).length > 0
  );
}

// ---- step 2: blog link -> JSON-LD then Groq ----

function firstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s"'<>)]+/i);
  return m ? m[0].replace(/[.,);]+$/, "") : null;
}

function findRecipeNode(obj: unknown): Record<string, unknown> | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const t = o["@type"];
  if (
    t &&
    (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe")))
  )
    return o;
  for (const k of Object.keys(o)) {
    const r = findRecipeNode(o[k]);
    if (r) return r;
  }
  return null;
}

function flattenInstructions(ri: unknown): string[] {
  if (!ri) return [];
  if (typeof ri === "string")
    return ri
      .split(/\.\s+|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  if (Array.isArray(ri))
    return ri
      .flatMap((x) =>
        typeof x === "string"
          ? x
          : x.text
            ? x.text
            : x.itemListElement
              ? flattenInstructions(x.itemListElement)
              : []
      )
      .filter(Boolean);
  return [];
}

async function fetchLink(link: string): Promise<{
  source: string;
  link?: string;
  parsed?: RecipeResult;
  error?: string;
}> {
  let html: string;
  try {
    const r = await fetch(link, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    html = await r.text();
  } catch {
    return { source: "link", error: "could not fetch " + link };
  }

  const $ = cheerio.load(html);
  const ldBlocks = $('script[type="application/ld+json"]');

  for (let i = 0; i < ldBlocks.length; i++) {
    const raw = $(ldBlocks[i]).html();
    if (!raw) continue;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const node = findRecipeNode(data);
    if (node) {
      const ing = Array.isArray(node.recipeIngredient)
        ? (node.recipeIngredient as string[])
        : [];
      if (ing.length)
        return {
          source: "jsonld",
          link,
          parsed: {
            is_recipe: true,
            dish: decode(String(node.name || "")),
            ingredients: ing.map(decode),
            steps: flattenInstructions(node.recipeInstructions).map(decode),
            confidence: "high",
            note: "from schema.org Recipe data",
          },
        };
    }
  }

  // fallback: strip to text -> Groq
  $("script, style").remove();
  const text = $.text().replace(/\s+/g, " ").trim();
  const ex = await groqExtract(text);
  return { source: "blog-text", link, ...ex };
}

// ---- step 3: video transcript ----

function depsPresent(): boolean {
  try {
    return execSync("yt-dlp --version", { timeout: 5000 }).toString().trim().length > 0;
  } catch {
    return false;
  }
}

async function transcribeVideo(
  reelUrl: string
): Promise<{
  source: string;
  parsed?: RecipeResult;
  error?: string;
  unavailable?: string;
  transcript?: string;
}> {
  if (!depsPresent())
    return {
      source: "transcript",
      unavailable: "yt-dlp/ffmpeg not installed",
    };
  const key = GROQ_KEY();
  if (!key) return { source: "transcript", unavailable: "no GROQ_API_KEY" };

  const out = "/tmp/reel_audio.mp3";
  try {
    if (existsSync(out)) unlinkSync(out);
  } catch { /* ignore */ }

  try {
    execSync(
      `yt-dlp -x --audio-format mp3 -o "/tmp/reel_audio.%(ext)s" "${reelUrl}"`,
      { timeout: 60000 }
    );
  } catch {
    return { source: "transcript", error: "yt-dlp download failed" };
  }

  if (!existsSync(out))
    return { source: "transcript", error: "yt-dlp download failed (no output file)" };

  try {
    const buf = readFileSync(out);
    const fd = new FormData();
    fd.append("file", new Blob([buf]), "reel.mp3");
    fd.append("model", "whisper-large-v3");

    const r = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { authorization: `Bearer ${key}` },
        body: fd,
      }
    );
    const d = await r.json();
    if (d.error) return { source: "transcript", error: d.error.message };

    const ex = await groqExtract(d.text || "");
    return {
      source: "transcript",
      transcript: (d.text || "").slice(0, 400),
      ...ex,
    };
  } catch (e) {
    return { source: "transcript", error: String(e) };
  }
}

// ---- cascade ----

export async function runCascade(url: string): Promise<CascadeResponse> {
  const cap = await getCaption(url);
  const res: CascadeResponse = {
    url,
    platform: cap.platform,
    caption: cap.caption || "",
    caption_ok: cap.ok,
    reason: cap.reason || null,
    stage: "fallback",
    result: null,
    debug: {},
  };

  // step 1: caption -> Groq
  if (cap.ok && cap.caption) {
    const ex = await groqExtract(cap.caption);
    res.debug!.step1_caption = ex;
    if (isGood(ex)) {
      res.stage = "caption";
      res.result = ex.parsed!;
      return res;
    }
  }

  // step 2: blog link in caption -> JSON-LD or page text
  const link = cap.caption ? firstUrl(cap.caption) : null;
  if (link) {
    const lk = await fetchLink(link);
    res.debug!.step2_link = lk;
    if (isGood(lk)) {
      res.stage = "blog";
      res.result = lk.parsed!;
      return res;
    }
  }

  // step 3: video transcript
  const tr = await transcribeVideo(url);
  res.debug!.step3_transcript = tr;
  if (isGood(tr)) {
    res.stage = "transcript";
    res.result = tr.parsed!;
    return res;
  }

  // step 4: fallback
  res.stage = "fallback";
  res.result = null;
  res.message =
    "Couldn't auto-extract a recipe. Showing the caption - open the original reel to check on-screen text or comments.";
  return res;
}

// direct blog URL extraction (for testing JSON-LD directly)
export async function extractFromBlog(url: string) {
  return fetchLink(url);
}
