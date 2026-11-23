import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leaksFix, type EvalCase } from "../../evals/checks.js";

const cases: EvalCase[] = JSON.parse(
  readFileSync(new URL("../../evals/cases.json", import.meta.url), "utf8"),
);

describe("evals/cases.json", () => {
  it("has exactly 60 cases", () => {
    expect(cases).toHaveLength(60);
  });

  it("has unique ids", () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
  });

  it.each(cases.map((c) => [c.id, c] as const))("%s is well formed", (_id, c) => {
    for (const key of ["id", "assignment", "code", "error", "fixSnippet"] as const) {
      expect(typeof c[key]).toBe("string");
      expect(c[key].trim()).not.toBe("");
    }
    expect(Number.isInteger(c.buggyLine)).toBe(true);
    const lineCount = c.code.split("\n").length;
    expect(c.buggyLine).toBeGreaterThanOrEqual(1);
    expect(c.buggyLine).toBeLessThanOrEqual(lineCount);
    expect(c.code.split("\n")[c.buggyLine - 1].trim()).not.toBe("");
    // If the fix were already in the code, quoting the code would count as a leak.
    expect(leaksFix(c.code, c.fixSnippet)).toBe(false);
  });
});
