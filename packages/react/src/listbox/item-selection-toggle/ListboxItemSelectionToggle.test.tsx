import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const VALUES = ['a', 'b', 'c', 'd', 'e'];

function TestListbox(
  props: Partial<Listbox.Root.Props<string, true | 'opt-in'>> & {
    disabledValues?: string[];
    single?: boolean;
  },
) {
  const { disabledValues = [], single, ...rootProps } = props;
  const items = VALUES.map((value) => (
    <Listbox.Item
      key={value}
      value={value}
      disabled={disabledValues.includes(value)}
      style={{ display: 'flex', height: 30 }}
    >
      <Listbox.ItemSelectionToggle
        data-testid={`toggle-${value}`}
        style={{ width: 30, height: 30 }}
      />
      <span data-testid={`text-${value}`} style={{ flex: 1 }}>
        {value}
      </span>
    </Listbox.Item>
  ));

  if (single) {
    return (
      <Listbox.Root defaultValue="a">
        <Listbox.List>{items}</Listbox.List>
      </Listbox.Root>
    );
  }

  return (
    <Listbox.Root multiple {...rootProps}>
      <Listbox.List style={{ width: 200 }}>{items}</Listbox.List>
    </Listbox.Root>
  );
}

function selectedValues() {
  return screen
    .getAllByRole('option')
    .filter((option) => option.getAttribute('aria-selected') === 'true')
    .map((option) => option.textContent);
}

function centerOf(element: Element) {
  const rect = element.getBoundingClientRect();
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
}

function press(testId: string, init?: PointerEventInit) {
  const element = screen.getByTestId(testId);
  fireEvent.pointerDown(element, { pointerId: 1, button: 0, ...centerOf(element), ...init });
}

function moveTo(testId: string) {
  const element = screen.getByTestId(testId);
  fireEvent.pointerMove(element, { pointerId: 1, ...centerOf(element) });
}

async function waitForFrames(count: number) {
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
}

function release(testId: string) {
  const element = screen.getByTestId(testId);
  fireEvent.pointerUp(element, { pointerId: 1, ...centerOf(element) });
}

describe('<Listbox.ItemSelectionToggle />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.ItemSelectionToggle />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">{node}</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    },
  }));

  it('is hidden from assistive technology and reflects the item state', async () => {
    await render(<TestListbox defaultValue={['a']} disabledValues={['b']} />);

    expect(screen.getByTestId('toggle-a')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('toggle-a')).toHaveAttribute('data-selected');
    expect(screen.getByTestId('toggle-b')).not.toHaveAttribute('data-selected');
    expect(screen.getByTestId('toggle-b')).toHaveAttribute('data-disabled');
  });

  describe('press', () => {
    it('toggles the item when the pointer goes down, and ignores the click that follows', async () => {
      await render(<TestListbox defaultValue={['a']} />);

      press('toggle-b');
      expect(selectedValues()).toEqual(['a', 'b']);

      release('toggle-b');
      fireEvent.click(screen.getByTestId('toggle-b'));
      expect(selectedValues()).toEqual(['a', 'b']);

      press('toggle-a');
      release('toggle-a');
      fireEvent.click(screen.getByTestId('toggle-a'));
      expect(selectedValues()).toEqual(['b']);
    });

    it('ignores the click when the pointer is released elsewhere on the item', async () => {
      await render(<TestListbox defaultValue={['a']} />);

      press('toggle-b');
      release('text-b');
      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      expect(selectedValues()).toEqual(['a', 'b']);
    });

    it('keeps the rest of the selection in opt-in mode', async () => {
      await render(<TestListbox multiple="opt-in" defaultValue={['a', 'b']} />);

      press('toggle-d');
      release('toggle-d');
      fireEvent.click(screen.getByTestId('toggle-d'));
      expect(selectedValues()).toEqual(['a', 'b', 'd']);

      // A press on the rest of the item still replaces the selection.
      fireEvent.click(screen.getByTestId('text-c'));
      expect(selectedValues()).toEqual(['c']);
    });

    it('moves focus to the item', async () => {
      await render(<TestListbox />);

      press('toggle-c');

      expect(screen.getByRole('option', { name: 'c' })).toHaveFocus();
    });

    it.each([true, 'opt-in'] as const)(
      'selects a range with Shift when multiple is %s',
      async (multiple) => {
        await render(<TestListbox multiple={multiple} />);

        press('toggle-b');
        release('toggle-b');
        press('toggle-d', { shiftKey: true });
        release('toggle-d');
        fireEvent.click(screen.getByTestId('toggle-d'), { shiftKey: true });

        expect(selectedValues()).toEqual(['b', 'c', 'd']);
      },
    );

    it('does nothing on a disabled item', async () => {
      const onValueChange = vi.fn();
      await render(<TestListbox disabledValues={['b']} onValueChange={onValueChange} />);

      press('toggle-b');
      release('toggle-b');
      fireEvent.click(screen.getByTestId('toggle-b'));

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('ignores other mouse buttons', async () => {
      await render(<TestListbox />);

      press('toggle-b', { button: 2 });

      expect(selectedValues()).toEqual([]);
    });

    it('is an ordinary press on the item with single selection', async () => {
      await render(<TestListbox single />);

      press('toggle-b');
      expect(selectedValues()).toEqual(['a']);

      release('toggle-b');
      fireEvent.click(screen.getByTestId('toggle-b'));
      expect(selectedValues()).toEqual(['b']);
    });

    it('lets the keyboard select after a press whose click never arrived', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      release('toggle-a');
      const itemA = screen.getByRole('option', { name: 'a' });
      fireEvent.keyDown(itemA, { key: ' ' });
      fireEvent.keyUp(itemA, { key: ' ' });

      expect(selectedValues()).toEqual([]);
    });
  });

  describe.skipIf(isJSDOM)('painting', () => {
    it.each([true, 'opt-in'] as const)(
      'selects the items whose toggles the pointer crosses when multiple is %s',
      async (multiple) => {
        await render(<TestListbox multiple={multiple} defaultValue={['e']} />);

        press('toggle-a');
        moveTo('toggle-b');
        moveTo('toggle-c');
        release('toggle-c');

        expect(selectedValues()).toEqual(['a', 'b', 'c', 'e']);
      },
    );

    it('paints every toggle that the pointer crossed between two events', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      const toggleD = screen.getByTestId('toggle-d');
      const moveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 1,
        ...centerOf(toggleD),
      });
      moveEvent.getCoalescedEvents = () =>
        ['toggle-b', 'toggle-c', 'toggle-d'].map(
          (testId) => new PointerEvent('pointermove', centerOf(screen.getByTestId(testId))),
        );
      fireEvent(toggleD, moveEvent);

      expect(selectedValues()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('deselects when the pressed item was selected', async () => {
      await render(<TestListbox defaultValue={['a', 'b', 'd']} />);

      press('toggle-a');
      moveTo('toggle-b');
      moveTo('toggle-c');
      moveTo('toggle-d');
      release('toggle-d');

      expect(selectedValues()).toEqual([]);
    });

    it('keeps the items painted when the pointer goes back', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      moveTo('toggle-b');
      moveTo('toggle-c');
      moveTo('toggle-b');
      moveTo('toggle-a');
      release('toggle-a');

      expect(selectedValues()).toEqual(['a', 'b', 'c']);
    });

    it('only paints the items whose toggle is under the pointer', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      moveTo('text-b');
      moveTo('text-c');
      moveTo('toggle-d');
      release('toggle-d');

      expect(selectedValues()).toEqual(['a', 'd']);
    });

    it('skips disabled items', async () => {
      await render(<TestListbox disabledValues={['b']} />);

      press('toggle-a');
      moveTo('toggle-b');
      moveTo('toggle-c');
      release('toggle-c');

      expect(selectedValues()).toEqual(['a', 'c']);
    });

    it('stops when the pointer is released', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      moveTo('toggle-b');
      release('toggle-b');
      moveTo('toggle-c');

      expect(selectedValues()).toEqual(['a', 'b']);
    });

    it('stops when the pointer is canceled', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      fireEvent.pointerCancel(screen.getByTestId('toggle-a'), { pointerId: 1 });
      moveTo('toggle-b');

      expect(selectedValues()).toEqual(['a']);
    });

    it('ignores other pointers', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      const toggleB = screen.getByTestId('toggle-b');
      fireEvent.pointerMove(toggleB, { pointerId: 2, ...centerOf(toggleB) });

      expect(selectedValues()).toEqual(['a']);
    });

    it('does not paint after a Shift+press', async () => {
      await render(<TestListbox />);

      press('toggle-a', { shiftKey: true });
      moveTo('toggle-b');

      expect(selectedValues()).toEqual(['a']);
    });

    it('moves focus to the painted item and extends the next Shift+press from it', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      moveTo('toggle-b');
      release('toggle-b');
      expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();

      press('toggle-d', { shiftKey: true });
      expect(selectedValues()).toEqual(['b', 'c', 'd']);
    });

    it('does not highlight hovered items during the drag', async () => {
      await render(<TestListbox />);

      press('toggle-a');
      fireEvent.mouseMove(screen.getByTestId('text-c'));

      expect(screen.getByRole('option', { name: 'c' })).not.toHaveAttribute('data-highlighted');
    });

    it('calls onValueChange once per painted item and continues after a canceled change', async () => {
      const onValueChange = vi.fn((value: string[], details: Listbox.Root.ChangeEventDetails) => {
        if (value.includes('b')) {
          details.cancel();
        }
      });
      await render(<TestListbox onValueChange={onValueChange} />);

      press('toggle-a');
      moveTo('toggle-b');
      moveTo('toggle-c');
      release('toggle-c');

      expect(onValueChange.mock.calls.map(([value, details]) => [value, details.reason])).toEqual([
        [['a'], 'item-press'],
        [['a', 'b'], 'item-press'],
        [['a', 'c'], 'item-press'],
      ]);
      expect(selectedValues()).toEqual(['a', 'c']);
    });

    describe('auto-scroll', () => {
      function ScrollingListbox() {
        return (
          <div data-testid="scroller" style={{ height: 90, overflow: 'auto' }}>
            <TestListbox />
          </div>
        );
      }

      function moveToPoint(clientX: number, clientY: number) {
        fireEvent.pointerMove(document.body, { pointerId: 1, clientX, clientY });
      }

      it('scrolls the container and paints the items that come into view while the pointer is near its edge', async () => {
        await render(<ScrollingListbox />);
        const scroller = screen.getByTestId('scroller');
        const { clientX } = centerOf(screen.getByTestId('toggle-a'));
        const { bottom } = scroller.getBoundingClientRect();

        press('toggle-a');
        moveToPoint(clientX, bottom - 5);

        await waitFor(() => {
          expect(scroller.scrollTop).toBe(scroller.scrollHeight - scroller.clientHeight);
        });
        expect(selectedValues()).toEqual(['a', 'c', 'd', 'e']);
      });

      it('scrolls back when the pointer moves to the opposite edge', async () => {
        await render(<ScrollingListbox />);
        const scroller = screen.getByTestId('scroller');
        scroller.scrollTop = 60;
        const { clientX } = centerOf(screen.getByTestId('toggle-e'));
        const { top } = scroller.getBoundingClientRect();

        press('toggle-e');
        moveToPoint(clientX, top + 5);

        await waitFor(() => {
          expect(scroller.scrollTop).toBe(0);
        });
        expect(selectedValues()).toEqual(['a', 'b', 'c', 'e']);
      });

      it('does not scroll before the pointer moves toward the edge', async () => {
        await render(<ScrollingListbox />);
        const scroller = screen.getByTestId('scroller');

        // The third toggle sits at the bottom edge of the container.
        press('toggle-c');
        const { clientX, clientY } = centerOf(screen.getByTestId('toggle-c'));
        moveToPoint(clientX, clientY - 1);
        await waitForFrames(5);

        expect(scroller.scrollTop).toBe(0);
      });

      it('stops scrolling when the pointer is released', async () => {
        await render(<ScrollingListbox />);
        const scroller = screen.getByTestId('scroller');
        const { clientX } = centerOf(screen.getByTestId('toggle-a'));
        const { bottom } = scroller.getBoundingClientRect();

        press('toggle-a');
        moveToPoint(clientX, bottom - 5);
        await waitFor(() => {
          expect(scroller.scrollTop).toBeGreaterThan(0);
        });
        fireEvent.pointerUp(document.body, { pointerId: 1 });
        const scrollTop = scroller.scrollTop;
        await waitForFrames(5);

        expect(scroller.scrollTop).toBe(scrollTop);
      });
    });

    it('paints the item that scrolls under a pointer that is not moving', async () => {
      await render(
        <div data-testid="scroller" style={{ height: 60, overflow: 'auto' }}>
          <TestListbox />
        </div>,
      );
      const scroller = screen.getByTestId('scroller');

      press('toggle-a');
      scroller.scrollTop = 30;
      fireEvent.scroll(scroller);

      expect(selectedValues()).toEqual(['a', 'b']);
    });
  });
});
