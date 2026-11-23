CREATE TABLE hints (
  id          SERIAL PRIMARY KEY,
  assignment  TEXT NOT NULL,
  code        TEXT NOT NULL,
  error       TEXT NOT NULL,
  hint        TEXT NOT NULL,
  line        INTEGER NOT NULL,
  model       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE feedback (
  id          SERIAL PRIMARY KEY,
  hint_id     INTEGER NOT NULL REFERENCES hints(id) ON DELETE CASCADE,
  helpful     BOOLEAN NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX feedback_hint_id_idx ON feedback (hint_id);
