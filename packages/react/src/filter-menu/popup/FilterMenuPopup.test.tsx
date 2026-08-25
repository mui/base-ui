import { expect } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { createRenderer, resetBrowserPointer } from '#test-utils';

describe('<FilterMenu.Popup />', () => {
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
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
          <FilterMenu.Root defaultOpen>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List style={{ direction: 'rtl' }}>
                    <FilterMenu.Item>Rename</FilterMenu.Item>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>
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
