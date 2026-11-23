export interface HintResponse {
  hintId: number;
  hint: string;
  line: number;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export function requestHint(assignment: string, code: string, error: string) {
  return post<HintResponse>("/api/hint", { assignment, code, error });
}

export function sendFeedback(hintId: number, helpful: boolean, comment: string) {
  return post<{ ok: true }>("/api/feedback", { hintId, helpful, comment: comment || null });
}
