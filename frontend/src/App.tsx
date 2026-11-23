import { useState, type FormEvent } from "react";
import { requestHint, type HintResponse } from "./api.ts";
import CodeView from "./CodeView.tsx";
import Feedback from "./Feedback.tsx";

export default function App() {
  const [assignment, setAssignment] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<HintResponse | null>(null);
  // The code the current hint is about, so later edits don't shift the highlight.
  const [hintedCode, setHintedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setRequestError("");
    setResult(null);
    try {
      setResult(await requestHint(assignment, code, error));
      setHintedCode(code);
    } catch (err) {
      setRequestError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Hintbot</h1>
      <p className="muted">Paste your assignment, code and error. You'll get one hint, not the answer.</p>

      <form onSubmit={handleSubmit}>
        <label>
          Assignment
          <textarea rows={3} value={assignment} onChange={(e) => setAssignment(e.target.value)} />
        </label>
        <label>
          Your code
          <textarea
            rows={12}
            className="mono"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </label>
        <label>
          Error or what goes wrong
          <textarea rows={2} value={error} onChange={(e) => setError(e.target.value)} />
        </label>
        <button type="submit" disabled={loading || code.trim() === ""}>
          {loading ? "Thinking..." : "Get a hint"}
        </button>
      </form>

      {requestError && <p className="error">{requestError}</p>}

      {result && (
        <section className="result">
          <h2>Hint (line {result.line})</h2>
          <p>{result.hint}</p>
          <CodeView code={hintedCode} highlightLine={result.line} />
          <Feedback key={result.hintId} hintId={result.hintId} />
        </section>
      )}
    </main>
  );
}
