import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { loadConfig } from "../config.mjs";

// DOTENV_CONFIG_PATH-szal másik (vagy nem létező) fájl adható meg — a tesztek így nem olvassák a fejlesztői .env-et.
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env", quiet: true });

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** A parancssori eszközök ugyanazt az adatmappát és adatbázist használják, mint a szerver. */
export function cliConfig() {
  const config = loadConfig(process.env, { root });
  return { dataDir: config.dataDir, dbPath: config.app.dbPath };
}
