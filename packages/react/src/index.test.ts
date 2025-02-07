/**
 * Important: This test also serves as a point to
 * import the entire lib for coverage reporting
 */
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { isJSDOM } from '#test-utils';
import * as BaseUI from './index';

describe('@base-ui-components/react', () => {
  it('should have exports', () => {
    expect(typeof BaseUI).to.equal('object');
  });

  it('should not have undefined exports', () => {
    (Object.keys(BaseUI) as (keyof typeof BaseUI)[]).forEach((exportKey) => {
      expect(Boolean(BaseUI[exportKey])).to.equal(true);
    });
  });

  it.skipIf(!isJSDOM)('should have the correct root exports', async () => {
    const packageJson = await import('../package.json');
    const subpathExports = packageJson.exports;

    await Promise.all(
      Object.keys(subpathExports)
        .filter((key) => !['.', './utils'].includes(key) && !key.startsWith('./unstable-'))
        .map(async (subpath) => {
          const importSpecifier = `@base-ui-components/react/${subpath.replace('./', '')}`;
          const module = await import(importSpecifier);

          Object.keys(module).forEach((exportKey) => {
            expect((BaseUI as Record<string, unknown>)[exportKey]).not.to.equal(
              undefined,
              `${exportKey} (from ${importSpecifier}) was not found in root exports`,
            );
          });
        }),
    );

    // Ensure the utils are also exported
    expect(BaseUI.utils).not.to.equal(undefined);
  });
});
