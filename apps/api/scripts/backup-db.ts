import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { env } from "../src/config.js";

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to back up the database.");
  process.exit(1);
}

const directory = process.env.BACKUP_DIR ?? "backups";
mkdirSync(directory, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = join(directory, `repairloop-${stamp}.dump`);
const pgDump = process.env.PG_DUMP ?? "pg_dump";

try {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      pgDump,
      ["--format=custom", "--no-owner", "--no-acl", "--file", file, databaseUrl],
      { stdio: "inherit" }
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${pgDump} exited with ${code}`));
    });
  });

  console.log(`Backup written to ${file}`);
} catch (error) {
  try {
    rmSync(file, { force: true });
  } catch {
    // The partial file may not exist.
  }
  console.error(
    "Backup failed. Use a pg_dump major version matching the Neon server (or the Neon console backup/restore), or set PG_DUMP to a compatible binary."
  );
  console.error(error);
  process.exitCode = 1;
}
