import { CreateMLCEngine, type MLCEngine, type InitProgressReport } from "@mlc-ai/web-llm";
import { SYSTEM_PROMPT, type LocalModelId } from "./constants";
import type { ArticleBiasReport } from "./types";

export type { MLCEngine };

export async function loadLocalModel(
  modelId: LocalModelId,
  onProgress: (progress: InitProgressReport) => void
): Promise<MLCEngine> {
  return CreateMLCEngine(modelId, { initProgressCallback: onProgress });
}

export async function analyzeWithLocal(
  engine: MLCEngine,
  content: string
): Promise<ArticleBiasReport> {
  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
  });
  const raw = reply.choices[0]?.message.content ?? "";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as ArticleBiasReport;
}
