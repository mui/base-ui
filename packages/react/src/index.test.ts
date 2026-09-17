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

  it('should export data attribute and CSS variable constants', () => {
    const metadata = Object.entries(BaseUI).filter(([name]) =>
      /(?:DataAttributes|CssVars)$/.test(name),
    );

    expect(metadata.length).toBeGreaterThan(0);

    metadata.forEach(([name, namespace]) => {
      const constants = Object.entries(namespace);
      expect(constants.length).toBeGreaterThan(0);

      constants.forEach(([key, value]) => {
        expect(value, `${name}.${key}`).toMatch(name.endsWith('CssVars') ? /^--/ : /^data-/);
      });
    });

    expect(BaseUI.DialogPopupCssVars.nestedDialogs).toBe('--nested-dialogs');
    expect(BaseUI.DialogPopupDataAttributes.open).toBe('data-open');
  });

  it('should export borrowed metadata under the derived component name', () => {
    expect(BaseUI.AlertDialogPopupCssVars).toBe(BaseUI.DialogPopupCssVars);
    expect(BaseUI.AlertDialogPopupDataAttributes).toBe(BaseUI.DialogPopupDataAttributes);
    expect(BaseUI.AutocompletePopupDataAttributes).toBe(BaseUI.ComboboxPopupDataAttributes);
    expect(BaseUI.ContextMenuItemDataAttributes).toBe(BaseUI.MenuItemDataAttributes);
  });

  it.skipIf(!isJSDOM)('should resolve internals and auxiliary exports', async () => {
    const packageJson = await import('../package.json');
    const subpathExports = packageJson.exports;

    const internalKeys = Object.keys(subpathExports).filter((key) =>
      key.startsWith('./internals/'),
    );

    await Promise.all(
      internalKeys.map(async (subpath) => {
        const importSpecifier = `@base-ui/react/${subpath.replace('./', '')}`;
        const module = await import(/* @vite-ignore */ importSpecifier);
        expect(module, `${subpath} failed to resolve`).toBeDefined();
      }),
    );
  });

  it.skipIf(!isJSDOM)('should have the correct root exports', async () => {
    const packageJson = await import('../package.json');
    const subpathExports = packageJson.exports;

    await Promise.all(
      Object.keys(subpathExports)
        .filter(
          (key) =>
            !['.', './utils', './types'].includes(key) &&
            !key.startsWith('./unstable-') &&
            !key.startsWith('./internals/'),
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
