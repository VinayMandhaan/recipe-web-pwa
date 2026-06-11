export function llmConfig() {
  const useGemini = !!process.env.GEMINI_API_KEY;
  return {
    key: useGemini ? process.env.GEMINI_API_KEY! : (process.env.GROQ_API_KEY || ""),
    model: useGemini ? (process.env.GEMINI_MODEL || "gemini-2.5-flash") : (process.env.GROQ_MODEL || "llama-3.1-8b-instant"),
    url: useGemini ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" : "https://api.groq.com/openai/v1/chat/completions",
    visionModel: useGemini ? (process.env.GEMINI_MODEL || "gemini-2.5-flash") : "meta-llama/llama-4-scout-17b-16e-instruct",
  };
}
