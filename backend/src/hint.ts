import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-5-5";

export interface HintRequest {
  assignment: string;
  code: string;
  error: string;
}

export interface Hint {
  hint: string;
  line: number;
}

// The slice of the Anthropic client we use. Tests pass a stub with this shape.
export interface HintClient {
  beta: {
    messages: {
      create(
        params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming,
      ): PromiseLike<Anthropic.Beta.Messages.BetaMessage>;
    };
  };
}

const promptPath = fileURLToPath(new URL("../prompts/hint.md", import.meta.url));
export const systemPrompt = readFileSync(promptPath, "utf8");

const hintSchema = {
  type: "object",
  properties: {
    hint: { type: "string" },
    line: { type: "integer" },
  },
  required: ["hint", "line"],
  additionalProperties: false,
};

export function numberLines(code: string): string {
  return code
    .split("\n")
    .map((text, i) => `${i + 1}: ${text}`)
    .join("\n");
}

export function buildUserMessage(req: HintRequest): string {
  return [
    `Assignment:\n${req.assignment}`,
    `Code:\n${numberLines(req.code)}`,
    `Error or behavior:\n${req.error}`,
  ].join("\n\n");
}

export function parseHint(text: string): Hint {
  const data = JSON.parse(text);
  if (typeof data.hint !== "string" || !Number.isInteger(data.line)) {
    throw new Error("Model response is missing hint or line");
  }
  return { hint: data.hint, line: data.line };
}

export async function getHint(client: HintClient, req: HintRequest): Promise<Hint> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: buildUserMessage(req) }],
    output_config: { effort: "low", format: { type: "json_schema", schema: hintSchema } },
    // If the model declines, let the API retry on its default fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Model declined to answer");
  }
  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Model returned no text");
  }
  return parseHint(text.text);
}
