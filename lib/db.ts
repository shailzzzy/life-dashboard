import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { DashboardData, emptyDashboardData } from "./types";

// Single hardcoded user for now (this is a personal, single-user dashboard).
const USER_ID = "shailen";

const LOCAL_FALLBACK_PATH = path.join(process.cwd(), ".data", "dashboard.json");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sql = any;

function hasNeon() {
  return !!process.env.DATABASE_URL;
}

async function ensureTable(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS dashboard_data (
      user_id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}

export async function loadData(): Promise<DashboardData> {
  if (hasNeon()) {
    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);
    const rows = await sql`SELECT data FROM dashboard_data WHERE user_id = ${USER_ID}`;
    if (rows.length === 0) {
      await sql`INSERT INTO dashboard_data (user_id, data) VALUES (${USER_ID}, ${JSON.stringify(emptyDashboardData)})`;
      return emptyDashboardData;
    }
    // Merge with defaults so old data (from a previous schema) doesn't crash the
    // app when it's missing keys the current UI expects — any field not present
    // in what's stored falls back to the default instead of being undefined.
    return { ...emptyDashboardData, ...(rows[0].data as Partial<DashboardData>) };
  }

  // Local fallback: a JSON file on disk. Lets us build and test before Neon is wired up.
  try {
    if (!fs.existsSync(LOCAL_FALLBACK_PATH)) {
      fs.mkdirSync(path.dirname(LOCAL_FALLBACK_PATH), { recursive: true });
      fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(emptyDashboardData, null, 2));
      return emptyDashboardData;
    }
    const stored = JSON.parse(fs.readFileSync(LOCAL_FALLBACK_PATH, "utf-8")) as Partial<DashboardData>;
    return { ...emptyDashboardData, ...stored };
  } catch {
    return emptyDashboardData;
  }
}

export async function saveData(data: DashboardData): Promise<void> {
  if (hasNeon()) {
    const sql = neon(process.env.DATABASE_URL!);
    await ensureTable(sql);
    await sql`
      INSERT INTO dashboard_data (user_id, data, updated_at)
      VALUES (${USER_ID}, ${JSON.stringify(data)}, now())
      ON CONFLICT (user_id) DO UPDATE SET data = ${JSON.stringify(data)}, updated_at = now()
    `;
    return;
  }

  fs.mkdirSync(path.dirname(LOCAL_FALLBACK_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(data, null, 2));
}
