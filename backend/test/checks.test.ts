import { describe, expect, it } from "vitest";
import { leaksFix, lineMatches } from "../../evals/checks.js";

describe("lineMatches", () => {
  it("passes only on an exact match", () => {
    expect(lineMatches(3, 3)).toBe(true);
    expect(lineMatches(2, 3)).toBe(false);
    expect(lineMatches(4, 3)).toBe(false);
  });
});

describe("leaksFix", () => {
  const fix = "i < nums.length";

  it("flags a hint that contains the fix", () => {
    expect(leaksFix("Change it to i < nums.length and it works.", fix)).toBe(true);
  });

  it("ignores whitespace differences", () => {
    expect(leaksFix("Try i<nums.length instead.", fix)).toBe(true);
    expect(leaksFix("Try i <\n   nums.length instead.", fix)).toBe(true);
  });

  it("does not flag a hint that only describes the problem", () => {
    const hint = "On line 3 your loop runs one step too far. Think about the last valid index of an array.";
    expect(leaksFix(hint, fix)).toBe(false);
  });

  it("does not flag the student's own buggy code being quoted", () => {
    expect(leaksFix("Look at `i <= nums.length` on line 3.", fix)).toBe(false);
  });

  it("is case sensitive", () => {
    expect(leaksFix('Compare against "enter".', '"Enter"')).toBe(false);
  });

  it("never flags an empty fix snippet", () => {
    expect(leaksFix("anything", "   ")).toBe(false);
  });
});
