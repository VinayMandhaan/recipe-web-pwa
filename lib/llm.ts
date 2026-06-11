type Provider = "gemini" | "groq";

const PROVIDERS = {
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key: () => process.env.GEMINI_API_KEY || "",
    model: () => process.env.GEMINI_MODEL || "gemini-2.5-flash",
    visionModel: () => process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: () => process.env.GROQ_API_KEY || "",
    model: () => process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    visionModel: () => "meta-llama/llama-4-scout-17b-16e-instruct",
  },
} as const;

export function getProvider(): Provider {
  return (process.env.LLM_PROVIDER as Provider) || "gemini";
}

export function llmConfig() {
  const provider = getProvider();
  const cfg = PROVIDERS[provider];
  return {
    provider,
    key: cfg.key(),
    model: cfg.model(),
    url: cfg.url,
    visionModel: cfg.visionModel(),
  };
}
