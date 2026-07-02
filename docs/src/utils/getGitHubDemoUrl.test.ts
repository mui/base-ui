import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGitHubDemoUrl } from './getGitHubDemoUrl';

describe('getGitHubDemoUrl', () => {
  const GITHUB_BASE = 'https://github.com/mui/base-ui/tree/v1.6.0';
  const unixUrl =
    'file:///home/user/base-ui/docs/src/app/(docs)/react/components/accordion/demos/hero/index.ts';
  const windowsUrl =
    'file:///C:/Users/Dev/base-ui/docs/src/app/(docs)/react/components/accordion/demos/hero/index.ts';

  beforeEach(() => {
    vi.stubEnv('SOURCE_CODE_REPO', 'https://github.com/mui/base-ui');
    vi.stubEnv('LIB_VERSION', '1.6.0');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('converts a Unix file URL to a GitHub directory URL', () => {
    expect(getGitHubDemoUrl(unixUrl)).toBe(
      `${GITHUB_BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
    );
  });

  it('converts a Windows file URL to a GitHub directory URL', () => {
    expect(getGitHubDemoUrl(windowsUrl)).toBe(
      `${GITHUB_BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
    );
  });

  it('appends the kebab-cased variant subdirectory for CssModules', () => {
    expect(getGitHubDemoUrl(unixUrl, 'CssModules')).toBe(
      `${GITHUB_BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero/css-modules`,
    );
  });

  it('appends the variant subdirectory for Tailwind', () => {
    expect(getGitHubDemoUrl(unixUrl, 'Tailwind')).toBe(
      `${GITHUB_BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero/tailwind`,
    );
  });

  it('does not append a subdirectory for the Default variant', () => {
    expect(getGitHubDemoUrl(unixUrl, 'Default')).toBe(
      `${GITHUB_BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
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

  it('returns null when source code repo metadata is unavailable', () => {
    vi.stubEnv('SOURCE_CODE_REPO', '');

    expect(getGitHubDemoUrl(unixUrl)).toBeNull();
  });

  it('returns null when library version metadata is unavailable', () => {
    vi.stubEnv('LIB_VERSION', '');

    expect(getGitHubDemoUrl(unixUrl)).toBeNull();
  });

  it('handles encoded URI components', () => {
    const encoded = unixUrl.replace(/\(/g, '%28').replace(/\)/g, '%29');
    expect(getGitHubDemoUrl(encoded)).toBe(
      `${GITHUB_BASE}/docs/src/app/(docs)/react/components/accordion/demos/hero`,
    );
  });
});
