import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { fakeClient, memoryStore } from "./fakes.js";

let server: Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

async function start(modelReply = '{"hint":"Look at the loop bound.","line":3}') {
  const db = memoryStore();
  const client = fakeClient(modelReply);
  server = createApp({ client, store: db.store }).listen(0);
  await new Promise((resolve) => server!.once("listening", resolve));
  const { port } = server.address() as AddressInfo;

  const post = (path: string, body: unknown) =>
    fetch(`http://localhost:${port}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  return { post, db, client };
}

const validHintBody = { assignment: "Sum an array", code: "a\nb\nc", error: "NaN" };

describe("POST /api/hint", () => {
  it("returns the hint and line and stores it", async () => {
    const { post, db, client } = await start();
    const res = await post("/api/hint", validHintBody);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hintId: 1, hint: "Look at the loop bound.", line: 3 });
    expect(db.hints).toHaveLength(1);
    expect(client.calls).toHaveLength(1);
  });

  it("rejects a request with missing fields", async () => {
    const { post, client } = await start();
    const res = await post("/api/hint", { code: "x" });

    expect(res.status).toBe(400);
    expect(client.calls).toHaveLength(0);
  });

  it("returns 502 when the model reply can't be parsed", async () => {
    const { post, db } = await start("sorry, no json");
    const res = await post("/api/hint", validHintBody);

    expect(res.status).toBe(502);
    expect(db.hints).toHaveLength(0);
  });
});

describe("POST /api/feedback", () => {
  it("saves feedback for an existing hint", async () => {
    const { post, db } = await start();
    await post("/api/hint", validHintBody);
    const res = await post("/api/feedback", { hintId: 1, helpful: false, comment: "too vague" });

    expect(res.status).toBe(201);
    expect(db.feedback).toEqual([{ hintId: 1, helpful: false, comment: "too vague" }]);
  });

  it("allows feedback without a comment", async () => {
    const { post, db } = await start();
    await post("/api/hint", validHintBody);
    const res = await post("/api/feedback", { hintId: 1, helpful: true });

    expect(res.status).toBe(201);
    expect(db.feedback[0].comment).toBeNull();
  });

  it("returns 404 for an unknown hint", async () => {
    const { post } = await start();
    const res = await post("/api/feedback", { hintId: 99, helpful: true });
    expect(res.status).toBe(404);
  });

  it("rejects a non-boolean helpful", async () => {
    const { post } = await start();
    const res = await post("/api/feedback", { hintId: 1, helpful: "yes" });
    expect(res.status).toBe(400);
  });
});
