/**
 * Canonical EVAL.ts — single source of truth.
 *
 * Every fixture's `EVAL.ts` is a byte-identical copy of this file. Edit only
 * this file and run `pnpm sync-evals` to propagate; `pnpm sync-evals --check`
 * fails on drift.
 *
 * Per-fixture tests gate themselves on `fixture` (the fixture's
 * `package.json` `name` field). Shared idiomatic checks for the combobox
 * family gate on `isComboboxFixture`, so the same file works for
 * `new-component` too.
 *
 * The underscore prefix on `evals/_EVAL.ts` keeps the framework from
 * mistaking it for a fixture — `discoverFixtures` only walks directories.
 */
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { test, expect } from 'vitest';

const APP_PATH = 'src/App.tsx';

const fixture = JSON.parse(readFileSync('package.json', 'utf-8')).name as string;
const isComboboxFixture = ['combobox', 'new-prop', 'breaking-change', 'docs-only-composition'].includes(
  fixture,
);

// -------- Universal --------

test('src/App.tsx exists', () => {
  expect(existsSync(APP_PATH)).toBe(true);
});

test('App.tsx does not use the @base-ui-components/react package', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).not.toMatch(/['"]@base-ui-components\/react/);
});

// -------- Per-fixture --------

test.skipIf(fixture !== 'combobox')('combobox: uses required Combobox parts', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  for (const part of ['Combobox.Root', 'Combobox.Input', 'Combobox.List', 'Combobox.Item']) {
    expect(source, `expected ${part} to appear in App.tsx`).toContain(part);
  }
});

test.skipIf(fixture !== 'new-component')('new-component: renders the Callout component', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).toMatch(/<Callout[\s/>]/);
});

test.skipIf(fixture !== 'new-prop')(
  'new-prop: uses required Combobox parts including Clear',
  () => {
    const source = readFileSync(APP_PATH, 'utf-8');
    for (const part of [
      'Combobox.Root',
      'Combobox.Input',
      'Combobox.List',
      'Combobox.Item',
      'Combobox.Clear',
    ]) {
      expect(source, `expected ${part} to appear in App.tsx`).toContain(part);
    }
  },
);

test.skipIf(fixture !== 'new-prop')('new-prop: uses the closeOnClear prop on the clear part', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).toMatch(/closeOnClear/);
});

test.skipIf(fixture !== 'breaking-change')(
  'breaking-change: uses required Combobox parts',
  () => {
    const source = readFileSync(APP_PATH, 'utf-8');
    for (const part of ['Combobox.Root', 'Combobox.Input', 'Combobox.List', 'Combobox.Item']) {
      expect(source, `expected ${part} to appear in App.tsx`).toContain(part);
    }
  },
);

test.skipIf(fixture !== 'breaking-change')(
  'breaking-change: uses the renamed reset part (Combobox.Reset)',
  () => {
    const source = readFileSync(APP_PATH, 'utf-8');
    expect(source).toContain('Combobox.Reset');
  },
);

test.skipIf(fixture !== 'breaking-change')(
  'breaking-change: does not use the removed Combobox.Clear part',
  () => {
    const source = readFileSync(APP_PATH, 'utf-8');
    expect(source).not.toContain('Combobox.Clear');
  },
);

test.skipIf(fixture !== 'docs-only-composition')(
  'docs-only-composition: uses required Combobox parts',
  () => {
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
  },
);

test.skipIf(fixture !== 'docs-only-composition')(
  'docs-only-composition: nests Combobox.RecentSearches inside Combobox.Empty',
  () => {
    const source = readFileSync(APP_PATH, 'utf-8');
    const blocks = source.matchAll(/<Combobox\.Empty\b[^>]*>([\s\S]*?)<\/Combobox\.Empty>/g);
    const nested = Array.from(blocks).some(([, inner]) =>
      inner.includes('Combobox.RecentSearches'),
    );
    expect(
      nested,
      'expected `Combobox.RecentSearches` to appear inside a `<Combobox.Empty>...</Combobox.Empty>` block',
    ).toBe(true);
  },
);

// -------- Shared idiomatic checks (combobox family) --------

test.skipIf(!isComboboxFixture)(
  'idiomatic: Combobox.List uses the function-child form (for filtering)',
  () => {
    const source = readFileSync(APP_PATH, 'utf-8');
    expect(source, 'expected `<Combobox.List>` to open with a function child').toMatch(
      /<Combobox\.List[^>]*>\s*\{\s*\(/,
    );
    expect(
      source,
      'do not render items by mapping inside `<Combobox.List>` — use the function-child API',
    ).not.toMatch(/<Combobox\.List[^>]*>\s*\{[^}]*\.map\(/);
  },
);

test.skipIf(!isComboboxFixture)('idiomatic: Combobox.Root passes items', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source, 'expected `<Combobox.Root>` to declare an `items` prop').toMatch(
    /<Combobox\.Root\b[^>]*\sitems\s*=/s,
  );
});

test.skipIf(!isComboboxFixture)('idiomatic: App.tsx does not use Combobox.useFilteredItems', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).not.toMatch(/useFilteredItems/);
});

// -------- Universal --------

test('npm run build succeeds', () => {
  execSync('npm run build', { stdio: 'pipe' });
});
