import type Anthropic from "@anthropic-ai/sdk";
import type { HintClient } from "../src/hint.js";
import type { Feedback, Store } from "../src/store.js";

type Params = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;

// Stands in for the Anthropic client: records requests and returns a canned reply.
export function fakeClient(text: string, stopReason = "end_turn") {
  const calls: Params[] = [];
  const client = {
    calls,
    beta: {
      messages: {
        async create(params: Params) {
          calls.push(params);
          return {
            stop_reason: stopReason,
            content: text ? [{ type: "text", text }] : [],
          } as unknown as Anthropic.Beta.Messages.BetaMessage;
        },
      },
    },
  };
  return client satisfies HintClient;
}

export function memoryStore() {
  const hints: { id: number; line: number }[] = [];
  const feedback: Feedback[] = [];
  const store: Store = {
    async saveHint(_req, hint) {
      const id = hints.length + 1;
      hints.push({ id, line: hint.line });
      return id;
    },
    async saveFeedback(f) {
      if (!hints.some((h) => h.id === f.hintId)) return false;
      feedback.push(f);
      return true;
    },
  };
  return { store, hints, feedback };
}
