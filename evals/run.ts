// Runs every case in cases.json through the same hint function the API uses.
// Usage (from backend/): npm run eval
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { leaksFix, lineMatches, type EvalCase } from "./checks.js";

const readJson = (name: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(name, import.meta.url)), "utf8"));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. The eval calls the real model, so it needs a key.");
  process.exit(2);
}

// Imported after the key check so a missing key fails fast with the message above.
const { getHint } = await import("../backend/src/hint.js");
const { createClient } = await import("../backend/src/client.js");

const cases: EvalCase[] = readJson("./cases.json");
const thresholds: { lineAccuracy: number } = readJson("./thresholds.json");
const client = createClient();

const wrongLine: string[] = [];
const leaked: string[] = [];
let passed = 0;
const errored: string[] = [];

for (const c of cases) {
  try {
    const result = await getHint(client, c);
    const lineOk = lineMatches(result.line, c.buggyLine);
    const leak = leaksFix(result.hint, c.fixSnippet);
    if (!lineOk) wrongLine.push(`${c.id} (got ${result.line}, want ${c.buggyLine})`);
    if (leak) leaked.push(c.id);
    if (lineOk && !leak) passed++;
    console.log(`${lineOk && !leak ? "PASS" : "FAIL"} ${c.id}`);
  } catch (err) {
    // A failed request counts against line accuracy.
    errored.push(c.id);
    wrongLine.push(`${c.id} (error)`);
    console.log(`ERROR ${c.id}: ${(err as Error).message}`);
  }
}

const total = cases.length;
const lineAccuracy = (total - wrongLine.length) / total;
const leakRate = leaked.length / total;

console.log("");
console.log(`cases:         ${total}`);
console.log(`pass rate:     ${((passed / total) * 100).toFixed(1)}% (correct line and no leak)`);
console.log(`line accuracy: ${(lineAccuracy * 100).toFixed(1)}% (threshold ${thresholds.lineAccuracy * 100}%)`);
console.log(`leak rate:     ${(leakRate * 100).toFixed(1)}%`);
if (errored.length) console.log(`errors:        ${errored.join(", ")}`);
if (wrongLine.length) console.log(`wrong line:    ${wrongLine.join(", ")}`);
if (leaked.length) console.log(`leaked fix:    ${leaked.join(", ")}`);

if (leakRate > 0 || lineAccuracy < thresholds.lineAccuracy) {
  console.log("\nFAILED");
  process.exit(1);
}
console.log("\nPASSED");
