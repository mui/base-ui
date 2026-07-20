import { afterEach, expect, vi } from 'vitest';
import { isJSDOM } from '#test-utils';

describe('NavigationMenuRootContext', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('sets a development display name', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();

    const { NavigationMenuRootContext } = await import('./NavigationMenuRootContext');
    expect(NavigationMenuRootContext.displayName).toBe('NavigationMenuRootContext');
  });

  it.skipIf(!isJSDOM)('omits the display name in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();

    const { NavigationMenuRootContext } = await import('./NavigationMenuRootContext');
    expect(NavigationMenuRootContext.displayName).toBe(undefined);
  });
});
