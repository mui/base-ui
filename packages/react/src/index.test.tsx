import { describe, it, expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
/**
 * Important: This test also serves as a point to
 * import the entire lib for coverage reporting
 */
import { createRenderer, isJSDOM } from '#test-utils';
import * as BaseUI from './index';

describe('@base-ui/react', () => {
  const { render } = createRenderer();

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
      /(?:DataAttributes|CssVariables)$/.test(name),
    );

    expect(metadata.map(([name]) => name).sort()).toMatchSnapshot();

    metadata.forEach(([name, namespace]) => {
      const constants = Object.entries(namespace);
      expect(constants.length).toBeGreaterThan(0);

      constants.forEach(([key, value]) => {
        expect(value, `${name}.${key}`).toMatch(name.endsWith('CssVariables') ? /^--/ : /^data-/);
      });
    });

    expect(BaseUI.DialogPopupCssVariables.nestedDialogs).toBe('--nested-dialogs');
    expect(BaseUI.DialogPopupDataAttributes.open).toBe('data-open');
  });

  it('should export borrowed metadata under the derived component name', () => {
    expect(BaseUI.AlertDialogPopupCssVariables).toBe(BaseUI.DialogPopupCssVariables);
    expect(BaseUI.AlertDialogPopupDataAttributes).toBe(BaseUI.DialogPopupDataAttributes);
    expect(BaseUI.AutocompletePopupDataAttributes).toBe(BaseUI.ComboboxPopupDataAttributes);
    expect(BaseUI.ContextMenuItemDataAttributes).toBe(BaseUI.MenuItemDataAttributes);
  });

  it('should expose the disabled attribute rendered by Button', async () => {
    await render(<BaseUI.Button disabled>Button</BaseUI.Button>);

    expect(screen.getByRole('button')).toHaveAttribute(BaseUI.ButtonDataAttributes.disabled);
  });

  it('should expose the attributes rendered by borrowed Drawer parts', async () => {
    const { user } = await render(
      <BaseUI.Drawer.Root modal={false}>
        <BaseUI.Drawer.Trigger>Open</BaseUI.Drawer.Trigger>
        <BaseUI.Drawer.Trigger disabled>Disabled</BaseUI.Drawer.Trigger>
        <BaseUI.Drawer.Close disabled>Close</BaseUI.Drawer.Close>
      </BaseUI.Drawer.Root>,
    );

    expect(screen.getByRole('button', { name: 'Disabled' })).toHaveAttribute(
      BaseUI.DrawerTriggerDataAttributes.disabled,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute(
      BaseUI.DrawerCloseDataAttributes.disabled,
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute(BaseUI.DrawerTriggerDataAttributes.popupOpen);
  });

  it.each(['Select', 'Combobox', 'Autocomplete'] as const)(
    'should expose the orientation attribute rendered by %s.Separator',
    async (component) => {
      const Separator = BaseUI[component].Separator;
      const dataAttributes = BaseUI[`${component}SeparatorDataAttributes`];

      await render(<Separator orientation="vertical" />);

      expect(screen.getByRole('presentation')).toHaveAttribute(
        dataAttributes.orientation,
        'vertical',
      );
    },
  );

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
