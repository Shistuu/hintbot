import type pg from "pg";
import type { Hint, HintRequest } from "./hint.js";

export interface Feedback {
  hintId: number;
  helpful: boolean;
  comment: string | null;
}

export interface Store {
  saveHint(req: HintRequest, hint: Hint, model: string): Promise<number>;
  // Returns false if the hint doesn't exist.
  saveFeedback(feedback: Feedback): Promise<boolean>;
}

export function pgStore(pool: pg.Pool): Store {
  return {
    async saveHint(req, hint, model) {
      const result = await pool.query<{ id: number }>(
        `INSERT INTO hints (assignment, code, error, hint, line, model)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [req.assignment, req.code, req.error, hint.hint, hint.line, model],
      );
      return result.rows[0].id;
    },

    async saveFeedback({ hintId, helpful, comment }) {
      const result = await pool.query(
        `INSERT INTO feedback (hint_id, helpful, comment)
         SELECT id, $2, $3 FROM hints WHERE id = $1`,
        [hintId, helpful, comment],
      );
      return result.rowCount === 1;
    },
  };
}
