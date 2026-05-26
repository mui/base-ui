/**
 * Helpers for synthetic patches. Patches operate on the *built* output of a
 * workspace package (string transforms on `.d.ts`/`.js`, plus the `exports`
 * map) — never on the source tree, and never on documentation.
 *
 * Every helper asserts its target exists so a change in Base UI's build
 * layout fails the pack step loudly instead of silently producing an
 * unpatched tarball.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Replace the first match of `search` in `file`, asserting it is present. */
export function editFile(file: string, search: string | RegExp, replace: string): void {
  const content = readFileSync(file, 'utf8');
  const found = typeof search === 'string' ? content.includes(search) : search.test(content);
  if (!found) {
    throw new Error(`Patch target not found in ${file}: ${String(search)}`);
  }
  writeFileSync(file, content.replace(search, replace));
}

/** Like `editFile`, but a no-op (returning false) when the file is absent. */
export function editFileIfExists(file: string, search: string | RegExp, replace: string): boolean {
  if (!existsSync(file)) {
    return false;
  }
  editFile(file, search, replace);
  return true;
}

/** Write a brand-new file, creating parent directories as needed. */
export function writeNewFile(file: string, content: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

/** Read, mutate, and re-write a JSON file. */
export function editJson(file: string, mutate: (json: any) => void): void {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  mutate(json);
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}
