import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { test, expect } from 'vitest';

const APP_PATH = 'src/App.tsx';

test('src/App.tsx exists', () => {
  expect(existsSync(APP_PATH)).toBe(true);
});

test('App.tsx imports from @base-ui/react/callout', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).toMatch(/from\s+['"]@base-ui\/react\/callout['"]/);
});

test('App.tsx does not use the @base-ui-components/react package', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).not.toMatch(/['"]@base-ui-components\/react/);
});

test('App.tsx renders the Callout component', () => {
  const source = readFileSync(APP_PATH, 'utf-8');
  expect(source).toMatch(/<Callout[\s/>]/);
});

test('npm run build succeeds', () => {
  execSync('npm run build', { stdio: 'pipe' });
});
