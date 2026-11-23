import pg from "pg";
import { createApp } from "./app.js";
import { createClient } from "./client.js";
import { pgStore } from "./store.js";

const port = Number(process.env.PORT ?? 3001);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set; /api/hint will fail until it is.");
}

const app = createApp({ client: createClient(), store: pgStore(pool) });

app.listen(port, () => {
  console.log(`hintbot backend listening on http://localhost:${port}`);
});
