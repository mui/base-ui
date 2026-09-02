import * as React from 'react';
import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, createDOMRect, setElementClientHeight } from '#test-utils';

function getOptions() {
  return screen.queryAllByRole('option');
}

describe('Select virtualization — navigation pin', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }
      return createDOMRect({ height: 60, width: 200 });
    });
  });

  describe('S1-2 / S1-3 — the navigation pin follows the collection', () => {
    function ReorderableSelect(props: { items: string[]; enabled: boolean; onValueChange: any }) {
      return (
        <Select.Root defaultOpen value="b" items={props.items} onValueChange={props.onValueChange}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  <Virtualizer<string>
                    enabled={props.enabled}
                    estimatedItemHeight={20}
                    getItemKey={(item) => item}
                    render={<div ref={setElementClientHeight(200)} />}
                  >
                    {(item: string) => <Select.Item value={item}>{item}</Select.Item>}
                  </Virtualizer>
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    it.each([
      ['an enabled', true],
      ['a disabled', false],
    ])('repins %s virtualized Select when its collection reorders', async (_name, enabled) => {
      const onValueChange = vi.fn();
      const { setProps, user } = await render(
        <ReorderableSelect
          items={['a', 'b', 'c', 'd']}
          enabled={enabled as boolean}
          onValueChange={onValueChange}
        />,
      );

      await waitFor(() => {
        expect(getOptions().length).toBe(4);
      });

      // `b` starts at index 1 and moves to index 0.
      await setProps({ items: ['b', 'a', 'c', 'd'] });
      await flushMicrotasks();

      const tabbable = getOptions().filter((option) => option.getAttribute('tabindex') === '0');
      expect(tabbable).toHaveLength(1);
      expect(tabbable[0].textContent).toBe('b');

      // The highlight settles on the repinned row a tick after the tabIndex does. Sending keys
      // before it lands makes navigation start from the old index — the test's own race, not the
      // behaviour under test.
      await waitFor(() => {
        expect(getOptions()[0]).toHaveAttribute('data-highlighted');
      });

      await user.keyboard('{ArrowDown}{Enter}');

      await waitFor(() => {
        expect(onValueChange).toHaveBeenCalled();
      });
      expect(onValueChange.mock.calls[0][0]).toBe('a');
    });
  });
});
