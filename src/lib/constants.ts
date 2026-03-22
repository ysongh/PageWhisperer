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

export const SYSTEM_PROMPT =
  "You are a helpful assistant. Summarize the following web page content concisely in a few paragraphs. Focus on the key points.";
