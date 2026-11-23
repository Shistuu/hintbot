import { describe, expect, it } from "vitest";
import { buildUserMessage, getHint, numberLines, parseHint } from "../src/hint.js";
import { fakeClient } from "./fakes.js";

describe("numberLines", () => {
  it("numbers lines starting at 1", () => {
    expect(numberLines("a\nb")).toBe("1: a\n2: b");
  });
});

describe("buildUserMessage", () => {
  it("includes the assignment, numbered code and error", () => {
    const msg = buildUserMessage({ assignment: "Sum it", code: "let x;\nx++", error: "NaN" });
    expect(msg).toContain("Sum it");
    expect(msg).toContain("2: x++");
    expect(msg).toContain("NaN");
  });
});

describe("parseHint", () => {
  it("reads hint and line", () => {
    expect(parseHint('{"hint":"Look at the loop.","line":3}')).toEqual({ hint: "Look at the loop.", line: 3 });
  });

  it("rejects responses without an integer line", () => {
    expect(() => parseHint('{"hint":"x","line":"3"}')).toThrow();
    expect(() => parseHint("not json")).toThrow();
  });
});

describe("getHint", () => {
  it("sends the system prompt and returns the parsed hint", async () => {
    const client = fakeClient('{"hint":"Check line 2.","line":2}');
    const hint = await getHint(client, { assignment: "a", code: "x\ny", error: "e" });

    expect(hint).toEqual({ hint: "Check line 2.", line: 2 });
    const params = client.calls[0];
    expect(params.model).toBe("claude-sonnet-5-5");
    expect(params.system).toContain("Never write the corrected code");
  });

  it("throws when the model refuses", async () => {
    const client = fakeClient("", "refusal");
    await expect(getHint(client, { assignment: "a", code: "x", error: "e" })).rejects.toThrow();
  });
});
