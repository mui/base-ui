import { expect, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, resetBrowserPointer } from '#test-utils';

describe('<Menu.Popup />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  describe('scrollbar presses', () => {
    function measureList(list: HTMLElement, overrides: Record<string, number>) {
      const base = {
        clientHeight: 100,
        clientWidth: 100,
        offsetHeight: 100,
        offsetWidth: 100,
        scrollHeight: 100,
        scrollWidth: 100,
      };
      Object.defineProperties(
        list,
        Object.fromEntries(
          Object.entries({ ...base, ...overrides }).map(([key, value]) => [
            key,
            { configurable: true, value },
          ]),
        ),
      );
    }

    it('allows a horizontal scrollbar press', async () => {
      await render(
        <Menu.FilterRoot defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterList>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.FilterRoot>,
      );

      const list = screen.getByRole('menu');
      measureList(list, { offsetHeight: 115, scrollWidth: 200 });

      const scrollbarMouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      Object.defineProperty(scrollbarMouseDown, 'offsetY', { value: 110 });

      await act(async () => {
        list.dispatchEvent(scrollbarMouseDown);
      });

      expect(scrollbarMouseDown.defaultPrevented).toBe(false);
    });

    it('allows an RTL vertical scrollbar press on the leading edge', async () => {
      await render(
        <DirectionProvider direction="rtl">
          <Menu.FilterRoot defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.FilterList style={{ direction: 'rtl' }}>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.FilterList>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.FilterRoot>
        </DirectionProvider>,
      );

      const list = screen.getByRole('menu');
      measureList(list, { offsetWidth: 115, scrollHeight: 200 });

      const scrollbarMouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      Object.defineProperty(scrollbarMouseDown, 'offsetX', { value: 5 });

      await act(async () => {
        list.dispatchEvent(scrollbarMouseDown);
      });

      expect(scrollbarMouseDown.defaultPrevented).toBe(false);
    });
  });
});
