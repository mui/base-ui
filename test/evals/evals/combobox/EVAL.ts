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
  for (const part of ['Combobox.Root', 'Combobox.Input', 'Combobox.List', 'Combobox.Item']) {
    expect(source, `expected ${part} to appear in App.tsx`).toContain(part);
  }
});

test('npm run build succeeds', () => {
  execSync('npm run build', { stdio: 'pipe' });
});
