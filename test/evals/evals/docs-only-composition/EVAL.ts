import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { test, expect } from 'vitest';

const APP_PATH = 'src/App.tsx';

test('src/App.tsx exists', () => {
  expect(existsSync(APP_PATH)).toBe(true);
});

test('App.tsx imports Combobox from @base-ui/react/combobox', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).toMatch(/from\s+['"]@base-ui\/react\/combobox['"]/);
});

test('App.tsx does not use the @base-ui-components/react package', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).not.toMatch(/['"]@base-ui-components\/react/);
});

test('App.tsx uses the required Combobox parts', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  for (const part of [
    'Combobox.Root',
    'Combobox.Input',
    'Combobox.List',
    'Combobox.Empty',
    'Combobox.RecentSearches',
  ]) {
    expect(source, `expected ${part} to appear in App.tsx`).toContain(part);
  }
});

test('App.tsx nests Combobox.RecentSearches inside Combobox.Empty', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  // Locate every `<Combobox.Empty ...>...</Combobox.Empty>` block (non-greedy,
  // allowing nested children) and confirm at least one contains
  // `Combobox.RecentSearches`. Self-closing `<Combobox.Empty />` matches
  // implicitly fail the nesting check, which is intentional — the part needs
  // to be a child.
  const blocks = source.matchAll(/<Combobox\.Empty\b[^>]*>([\s\S]*?)<\/Combobox\.Empty>/g);
  const nested = Array.from(blocks).some(([, inner]) => inner.includes('Combobox.RecentSearches'));
  expect(
    nested,
    'expected `Combobox.RecentSearches` to appear inside a `<Combobox.Empty>...</Combobox.Empty>` block',
  ).toBe(true);
});

test('npm run build succeeds', () => {
  execSync('npm run build', { stdio: 'pipe' });
});
