import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function openDatabase(dbPath) {
  // Ensure parent directory exists (e.g. Render with fresh filesystem).
  const parent = dirname(dbPath);
  if (parent && parent !== '.') {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    mkdirSync(parent, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    db.exec(sql);
  }

  return db;
}
