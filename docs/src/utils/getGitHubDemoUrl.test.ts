import { describe, it, expect } from 'vitest';
import { getGitHubDemoUrl } from './getGitHubDemoUrl';

const BASE = 'https://github.com/mui/base-ui/tree/master';

describe('getGitHubDemoUrl', () => {
  const unixUrl =
    'file:///home/user/base-ui/docs/src/app/(docs)/react/components/accordion/demos/hero/index.ts';
  const windowsUrl =
    'file:///C:/Users/Dev/base-ui/docs/src/app/(docs)/react/components/accordion/demos/hero/index.ts';

  it('converts a Unix file URL to a GitHub directory URL', () => {
    expect(getGitHubDemoUrl(unixUrl)).toBe(
      `${BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
    );
  });

  it('converts a Windows file URL to a GitHub directory URL', () => {
    expect(getGitHubDemoUrl(windowsUrl)).toBe(
      `${BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
    );
  });

  it('appends the kebab-cased variant subdirectory for CssModules', () => {
    expect(getGitHubDemoUrl(unixUrl, 'CssModules')).toBe(
      `${BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero/css-modules`,
    );
  });

  it('appends the variant subdirectory for Tailwind', () => {
    expect(getGitHubDemoUrl(unixUrl, 'Tailwind')).toBe(
      `${BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero/tailwind`,
    );
  });

  it('does not append a subdirectory for the Default variant', () => {
    expect(getGitHubDemoUrl(unixUrl, 'Default')).toBe(
      `${BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
    );
  });

  it('returns null for undefined url', () => {
    expect(getGitHubDemoUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getGitHubDemoUrl('')).toBeNull();
  });

  it('returns null when /docs/ is not in the path', () => {
    expect(getGitHubDemoUrl('file:///home/user/other-project/src/index.ts')).toBeNull();
  });

  it('handles encoded URI components', () => {
    const encoded = unixUrl.replace(/\(/g, '%28').replace(/\)/g, '%29');
    expect(getGitHubDemoUrl(encoded)).toBe(
      `${BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
    );
  });
});
