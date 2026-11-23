import { useState } from "react";
import { sendFeedback } from "./api.ts";

export default function Feedback({ hintId }: { hintId: number }) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(helpful: boolean) {
    setStatus("sending");
    try {
      await sendFeedback(hintId, helpful, comment.trim());
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="muted">Thanks for the feedback.</p>;
  }

  return (
    <div className="feedback">
      <input
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button disabled={status === "sending"} onClick={() => submit(true)}>
        This helped
      </button>
      <button disabled={status === "sending"} onClick={() => submit(false)}>
        This didn't help
      </button>
      {status === "error" && <p className="error">Couldn't send feedback. Try again.</p>}
    </div>
  );
}
