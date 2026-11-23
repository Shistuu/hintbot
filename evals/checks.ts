export interface EvalCase {
  id: string;
  assignment: string;
  code: string;
  error: string;
  buggyLine: number;
  fixSnippet: string;
}

export function lineMatches(returned: number, expected: number): boolean {
  return returned === expected;
}

const stripWhitespace = (s: string) => s.replace(/\s+/g, "");

// A hint leaks the fix if the fix snippet shows up in it, ignoring whitespace.
export function leaksFix(hint: string, fixSnippet: string): boolean {
  const fix = stripWhitespace(fixSnippet);
  return fix.length > 0 && stripWhitespace(hint).includes(fix);
}
