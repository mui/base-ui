import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';
import { Select } from '@base-ui/react/select';

// Kept in a separate file so the module mock doesn't leak into other tests.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      engine: { ...actual.platform.engine, webkit: true },
    },
  };
});

function SelectTest() {
  return (
    <Select.FilterProvider>
      <Select.Root defaultOpen>
        <Select.Trigger />
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Input aria-label="Filter" />
              <Select.List>
                <Select.Item value="apple">Apple</Select.Item>
                <Select.Item value="banana">Banana</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Select.FilterProvider>
  );
}

function MenuTest() {
  return (
    <Menu.FilterProvider>
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Input aria-label="Filter" />
              <Menu.List>
                <Menu.Item>Apple</Menu.Item>
                <Menu.Item>Banana</Menu.Item>
              </Menu.List>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menu.FilterProvider>
  );
}

describe('FilterDropdownInput (WebKit)', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it.each([
    { name: 'Select', Component: SelectTest },
    { name: 'Menu', Component: MenuTest },
  ])(
    '$name: passes focus through the popup when an arrow key returns to the input',
    async ({ Component }) => {
      const { user } = await render(<Component />);
      const input = screen.getByRole('searchbox', { name: 'Filter' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-activedescendant');
      });

      const popup = screen.getByRole('dialog');
      const focused: Element[] = [];
      popup.addEventListener('focusin', (event) => focused.push(event.target as Element));

      // Safari VoiceOver doesn't follow a removed `aria-activedescendant` back to the input.
      await user.keyboard('[ArrowUp]');

      expect(input).not.toHaveAttribute('aria-activedescendant');
      expect(focused).toEqual([popup, input]);
      expect(input).toHaveFocus();
    },
  );
});
