import { CreateMLCEngine, type MLCEngine, type InitProgressReport } from "@mlc-ai/web-llm";
import { SYSTEM_PROMPT, type LocalModelId } from "./constants";

export type { MLCEngine };

export async function loadLocalModel(
  modelId: LocalModelId,
  onProgress: (progress: InitProgressReport) => void
): Promise<MLCEngine> {
  return CreateMLCEngine(modelId, { initProgressCallback: onProgress });
}

export async function summarizeWithLocal(
  engine: MLCEngine,
  content: string
): Promise<string> {
  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
  });
  return reply.choices[0]?.message.content ?? "No summary generated.";
}
