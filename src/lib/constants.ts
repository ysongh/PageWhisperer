export const CLOUD_PROVIDERS = [
  { id: "gemini", label: "Google Gemini" },
  { id: "claude", label: "Anthropic Claude" },
  { id: "chatgpt", label: "OpenAI ChatGPT" },
] as const;

export type CloudProviderId = (typeof CLOUD_PROVIDERS)[number]["id"];

export const LOCAL_MODELS = [
  { id: "SmolLM2-360M-Instruct-q4f16_1-MLC", label: "SmolLM2 360M (fastest)" },
  { id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC", label: "SmolLM2 1.7B (balanced)" },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B" },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B (best quality)" },
] as const;

export type LocalModelId = (typeof LOCAL_MODELS)[number]["id"];

export type ProviderMode = "cloud" | "local";

export const SYSTEM_PROMPT = `You are a media bias analyst. Analyze the following web page content and return ONLY a valid JSON object (no markdown, no code fences) matching this exact schema:

{
  "outlet": {
    "outlet": "string — name of the publication/website",
    "lean": "one of: far-left, lean-left, center, lean-right, far-right"
  },
  "politicalLeanScore": "number 0–100; 0 = far left, 50 = center, 100 = far right",
  "biasDimensions": {
    "emotionalTone": "number 0–100",
    "sourceDiversity": "number 0–100",
    "framing": "number 0–100",
    "omissionRisk": "number 0–100",
    "factualGrounding": "number 0–100"
  },
  "flaggedPhrases": ["array of charged/loaded phrases found in the article"],
  "summary": {
    "text": "2-3 sentence bias summary of the article",
    "highlights": [
      {
        "kind": "one of: charged-language, source-count, omission, framing",
        "phrase": "substring from summary.text to annotate",
        "detail": "optional explanation"
      }
    ]
  }
}

Respond with ONLY the JSON object. No other text.`;
