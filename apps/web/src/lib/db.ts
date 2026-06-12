import "server-only";
import { openMainDatabase } from "@xinxianpai/db";
import { env } from "./env";

const globalForDb = globalThis as unknown as { xinxianpaiDb?: ReturnType<typeof openMainDatabase> };

export function db() {
  globalForDb.xinxianpaiDb ||= openMainDatabase(env.dataDir);
  return globalForDb.xinxianpaiDb;
}
