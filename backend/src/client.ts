import Anthropic from "@anthropic-ai/sdk";
import type { HintClient } from "./hint.js";

// Reads ANTHROPIC_API_KEY from the environment.
export function createClient(): HintClient {
  return new Anthropic();
}
