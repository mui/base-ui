import { describe, it, expect } from 'vitest';
/**
 * Important: This test also serves as a point to
 * import the entire lib for coverage reporting
 */
import { isJSDOM } from '#test-utils';
import * as BaseUI from './index';

describe('@base-ui/react', () => {
  it('should have exports', () => {
    expect(typeof BaseUI).toBe('object');
  });

  it('should not have undefined exports', () => {
    Object.keys(BaseUI).forEach((exportKey) => {
      const value = (BaseUI as Record<string, unknown>)[exportKey];
      expect(Boolean(value)).toBe(true);
    });
  });

  it.skipIf(!isJSDOM)('should have the correct root exports', async () => {
    const packageJson = await import('../package.json');
    const subpathExports = packageJson.exports;

    await Promise.all(
      Object.keys(subpathExports)
        .filter(
          (key) =>
            ![
              '.',
              './utils',
              './temporal-adapter-luxon',
              './temporal-adapter-date-fns',
              './types',
            ].includes(key) && !key.startsWith('./unstable-'),
        )
        .map(async (subpath) => {
          const importSpecifier = `@base-ui/react/${subpath.replace('./', '')}`;
          const module = await import(/* @vite-ignore */ importSpecifier);

          Object.keys(module).forEach((exportKey) => {
            expect((BaseUI as Record<string, unknown>)[exportKey]).not.toBeUndefined();
          });
        }),
    );
  });
});
