import express from "express";
import { getHint, MODEL, type HintClient } from "./hint.js";
import type { Store } from "./store.js";

interface Deps {
  client: HintClient;
  store: Store;
}

const isString = (v: unknown): v is string => typeof v === "string";

export function createApp({ client, store }: Deps) {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.post("/api/hint", async (req, res) => {
    const { assignment, code, error } = req.body ?? {};
    if (!isString(assignment) || !isString(code) || !isString(error) || code.trim() === "") {
      res.status(400).json({ error: "assignment, code and error must be strings, and code can't be empty" });
      return;
    }

    try {
      const input = { assignment, code, error };
      const hint = await getHint(client, input);
      const hintId = await store.saveHint(input, hint, MODEL);
      res.json({ hintId, hint: hint.hint, line: hint.line });
    } catch (err) {
      console.error(err);
      res.status(502).json({ error: "Could not get a hint right now" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    const { hintId, helpful, comment } = req.body ?? {};
    if (!Number.isInteger(hintId) || typeof helpful !== "boolean") {
      res.status(400).json({ error: "hintId must be an integer and helpful a boolean" });
      return;
    }
    if (comment !== undefined && comment !== null && !isString(comment)) {
      res.status(400).json({ error: "comment must be a string" });
      return;
    }

    try {
      const saved = await store.saveFeedback({ hintId, helpful, comment: comment ?? null });
      if (!saved) {
        res.status(404).json({ error: "No hint with that id" });
        return;
      }
      res.status(201).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not save feedback" });
    }
  });

  return app;
}
