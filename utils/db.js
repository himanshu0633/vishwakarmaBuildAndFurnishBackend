import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

export const loadDb = async () => {
  if (!existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}`);
  }

  const text = await readFile(DB_PATH, 'utf8');
  return JSON.parse(text);
};

export const saveDb = async (db) => {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
};
