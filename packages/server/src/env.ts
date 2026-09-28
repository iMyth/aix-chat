import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Load the monorepo-root `.env` before any module reads `process.env`.
 *
 * The path is resolved from this file instead of `process.cwd()`, so it works
 * the same from `src/` (tsx) and `dist/` (node), and no matter which directory
 * the process was started from.
 *
 * Import this FIRST in any module that reads `process.env` at module scope
 * (`process.env` values are read once, at import time, in `libs/db.ts` and
 * `routes/agent-chat.ts`).
 */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

/** Absolute path of the `.env` file the server reads — handy for messages. */
export const envPath = resolve(repoRoot, '.env')

config({ path: envPath, quiet: true })