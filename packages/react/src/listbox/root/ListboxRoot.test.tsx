import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { ListboxPreview as Listbox } from '@base-ui/react/listbox';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import type { BaseUIEvent } from '../../internals/types';

// The shortcuts differ on macOS, which `ListboxItem.mac.test.tsx` covers.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');
  return { platform: { ...actual.platform, os: { ...actual.platform.os, mac: false } } };
});

describe('<Listbox.Root />', () => {
  const { render } = createRenderer();

  describe('prop: defaultValue', () => {
    it('should select the item by default', async () => {
      await render(
        <Listbox.Root defaultValue="b">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });

  describe('prop: value (controlled)', () => {
    it('should select the item matching the value', async () => {
      await render(
        <Listbox.Root value="a">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');
    });

    it('keeps the selection when the value is not updated', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Listbox.Root value="a" onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).toHaveBeenCalledWith('b', expect.anything());
      expect(
        screen.getAllByRole('option', { selected: true }).map((option) => option.textContent),
      ).toEqual(['a']);
    });
  });

  describe('prop: onValueChange', () => {
    it('is not called when the selected item is pressed again in single selection', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Listbox.Root defaultValue="a" onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await user.click(screen.getByRole('option', { name: 'b' }));
      expect(handleValueChange).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
    });

    it('should call onValueChange when an item is clicked', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toBe('b');
    });

    it('reports a click with the item-press reason', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange.mock.calls[0][1].reason).toBe('item-press');
    });

    it.each([
      { outcome: 'keeps', condition: 'canceled', cancel: true, selected: 'a' },
      { outcome: 'moves', condition: 'not canceled', cancel: false, selected: 'b' },
    ])('$outcome the selection when the change is $condition', async ({ cancel, selected }) => {
      const { user } = await render(
        <Listbox.Root
          defaultValue="a"
          onValueChange={(_, eventDetails) => {
            if (cancel) {
              eventDetails.cancel();
            }
          }}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(
        screen.getAllByRole('option', { selected: true }).map((option) => option.textContent),
      ).toEqual([selected]);
    });

    it('is not called when Ctrl+A selects a list that is already fully selected', async () => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('is not called when Ctrl+A selects a fully selected list held in a different order', async () => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple defaultValue={['b', 'a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

      expect(handleValueChange).not.toHaveBeenCalled();
    });
  });

  describe('prop: onItemHighlighted', () => {
    it('is called when the highlighted position gets another item', async () => {
      const handleItemHighlighted = vi.fn();
      const before = ['a', 'b'];
      const after = ['x', 'b'];
      function App(props: { names: string[] }) {
        return (
          <Listbox.Root items={props.names} onItemHighlighted={handleItemHighlighted}>
            <Listbox.List>
              {props.names.map((name, index) => (
                <Listbox.Item key={index} value={name}>
                  {name}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }

      const { setProps } = await render(<App names={before} />);
      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      expect(handleItemHighlighted.mock.lastCall?.[0]).toBe('a');
      handleItemHighlighted.mockClear();

      await setProps({ names: after });

      expect(handleItemHighlighted.mock.calls.map((call) => [call[0], call[1].index])).toEqual([
        ['x', 0],
      ]);
    });

    function renderList(onItemHighlighted: Listbox.Root.Props<string>['onItemHighlighted']) {
      return render(
        <Listbox.Root onItemHighlighted={onItemHighlighted}>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="banana">Banana</Listbox.Item>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    }

    it('reports keyboard navigation with the keyboard reason', async () => {
      const handleItemHighlighted = vi.fn();
      await renderList(handleItemHighlighted);

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      handleItemHighlighted.mockClear();

      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute('data-highlighted');
      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      const [itemValue, eventDetails] = handleItemHighlighted.mock.calls[0];
      expect(itemValue).toBe('cherry');
      expect(eventDetails.reason).toBe('keyboard');
      expect(eventDetails.index).toBe(2);
      expect(eventDetails.event.type).toBe('keydown');
    });

    it('reports hovering with the pointer reason', async () => {
      const handleItemHighlighted = vi.fn();
      await renderList(handleItemHighlighted);

      await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
      handleItemHighlighted.mockClear();

      fireEvent.mouseMove(screen.getByRole('option', { name: 'Banana' }));

      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      const [itemValue, eventDetails] = handleItemHighlighted.mock.calls[0];
      expect(itemValue).toBe('banana');
      expect(eventDetails.reason).toBe('pointer');
      expect(eventDetails.index).toBe(1);
    });

    it('reports focus leaving the list as an unhighlight', async () => {
      const handleItemHighlighted = vi.fn();
      await render(
        <div>
          <Listbox.Root onItemHighlighted={handleItemHighlighted}>
            <Listbox.List>
              <Listbox.Item value="apple">Apple</Listbox.Item>
              <Listbox.Item value="banana">Banana</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
          <button>Outside</button>
        </div>,
      );

      await act(async () => screen.getByRole('option', { name: 'Banana' }).focus());
      handleItemHighlighted.mockClear();

      await act(async () => screen.getByRole('button', { name: 'Outside' }).focus());

      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      const [itemValue, eventDetails] = handleItemHighlighted.mock.calls[0];
      expect(itemValue).toBe(undefined);
      expect(eventDetails.reason).toBe('none');
      expect(eventDetails.index).toBe(-1);
    });

    it('reports focus without navigation with the none reason', async () => {
      const handleItemHighlighted = vi.fn();
      await renderList(handleItemHighlighted);

      await act(async () => screen.getByRole('option', { name: 'Cherry' }).focus());

      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      expect(handleItemHighlighted.mock.calls[0][0]).toBe('cherry');
      expect(handleItemHighlighted.mock.calls[0][1].reason).toBe('none');
    });

    it('reports an item that a layout effect focuses on mount', async () => {
      const handleItemHighlighted = vi.fn();
      function App() {
        const itemRef = React.useRef<HTMLDivElement>(null);
        React.useLayoutEffect(() => {
          itemRef.current?.focus();
        }, []);
        return (
          <Listbox.Root onItemHighlighted={handleItemHighlighted}>
            <Listbox.List>
              <Listbox.Item ref={itemRef} value="apple">
                Apple
              </Listbox.Item>
              <Listbox.Item value="banana">Banana</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      await render(<App />);

      expect(screen.getByRole('option', { name: 'Apple' })).toHaveFocus();
      expect(handleItemHighlighted.mock.calls.map((call) => [call[0], call[1].index])).toEqual([
        ['apple', 0],
      ]);
    });

    it('reports the item that takes the place of a removed highlighted item', async () => {
      const handleItemHighlighted = vi.fn();
      function App(props: { names: string[] }) {
        return (
          <Listbox.Root onItemHighlighted={handleItemHighlighted}>
            <Listbox.List>
              {props.names.map((name) => (
                <Listbox.Item key={name} value={name}>
                  {name}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }

      const { setProps } = await render(<App names={['a', 'b', 'c']} />);
      await act(async () => screen.getByRole('option', { name: 'b' }).focus());
      expect(handleItemHighlighted.mock.lastCall?.[0]).toBe('b');
      handleItemHighlighted.mockClear();

      await setProps({ names: ['a', 'c'] });

      expect(handleItemHighlighted.mock.calls.map((call) => [call[0], call[1].index])).toEqual([
        ['c', 1],
      ]);
    });

    it('does not report the highlighted item again when the callback is added later', async () => {
      const handleItemHighlighted = vi.fn();
      function App(props: { onItemHighlighted?: typeof handleItemHighlighted }) {
        return (
          <Listbox.Root onItemHighlighted={props.onItemHighlighted}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      const { setProps } = await render(<App />);
      await act(async () => screen.getByRole('option', { name: 'a' }).focus());

      await setProps({ onItemHighlighted: handleItemHighlighted });
      expect(handleItemHighlighted).not.toHaveBeenCalled();

      fireEvent.keyDown(screen.getByRole('option', { name: 'a' }), { key: 'ArrowDown' });
      expect(handleItemHighlighted.mock.calls.map((call) => call[0])).toEqual(['b']);
    });

    it('reports the new position once when the highlighted item moves', async () => {
      const handleItemHighlighted = vi.fn();
      function App(props: { names: string[] }) {
        return (
          <Listbox.Root onItemHighlighted={handleItemHighlighted}>
            <Listbox.List>
              {props.names.map((name) => (
                <Listbox.Item key={name} value={name}>
                  {name}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }

      const { setProps } = await render(<App names={['a', 'b', 'c']} />);
      await act(async () => screen.getByRole('option', { name: 'b' }).focus());
      expect(handleItemHighlighted.mock.lastCall?.[1].index).toBe(1);
      handleItemHighlighted.mockClear();

      await setProps({ names: ['c', 'a', 'b'] });

      expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
      expect(handleItemHighlighted.mock.calls.map((call) => [call[0], call[1].index])).toEqual([
        ['b', 2],
      ]);
    });

    it.each([
      { name: 'first', focused: 'a', index: 0 },
      { name: 'last', focused: 'b', index: 1 },
    ])(
      'reports an unhighlight once when every item is removed with focus on the $name one',
      async ({ focused, index }) => {
        const handleItemHighlighted = vi.fn();
        function App(props: { names: string[] }) {
          return (
            <Listbox.Root onItemHighlighted={handleItemHighlighted}>
              <Listbox.List>
                {props.names.map((name) => (
                  <Listbox.Item key={name} value={name}>
                    {name}
                  </Listbox.Item>
                ))}
              </Listbox.List>
            </Listbox.Root>
          );
        }

        const { setProps } = await render(<App names={['a', 'b']} />);
        await act(async () => screen.getByRole('option', { name: focused }).focus());
        expect(handleItemHighlighted.mock.lastCall?.[1].index).toBe(index);
        handleItemHighlighted.mockClear();

        await setProps({ names: [] });

        expect(handleItemHighlighted.mock.calls.map((call) => [call[0], call[1].index])).toEqual([
          [undefined, -1],
        ]);
      },
    );
  });

  describe('highlight', () => {
    function renderListWithOutsideButton(rootProps: Listbox.Root.Props<string> = {}) {
      return render(
        <div>
          <Listbox.Root {...rootProps}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
          <button>Outside</button>
        </div>,
      );
    }

    it('removes the highlight when focus leaves the list and restores it when focus returns', async () => {
      const { user } = await renderListWithOutsideButton({ defaultValue: 'b' });
      const itemB = screen.getByRole('option', { name: 'b' });

      await act(async () => itemB.focus());
      expect(itemB).toHaveAttribute('data-highlighted');

      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
      expect(itemB).not.toHaveAttribute('data-highlighted');
      expect(itemB).toHaveAttribute('tabindex', '0');

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(itemB).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');
    });

    it('keeps the highlight on the focused item when the pointer leaves it', async () => {
      const { user } = await renderListWithOutsideButton();
      const itemB = screen.getByRole('option', { name: 'b' });

      await user.click(itemB);
      expect(itemB).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');

      fireEvent.mouseLeave(itemB);
      await flushMicrotasks();

      expect(itemB).toHaveAttribute('data-highlighted');
    });

    it('keeps the highlight on the focused item when the items are reordered', async () => {
      function App({ items }: { items: string[] }) {
        return (
          <Listbox.Root>
            <Listbox.List>
              {items.map((item) => (
                <Listbox.Item key={item} value={item}>
                  {item}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }
      const { setProps, user } = await render(<App items={['a', 'b', 'c']} />);
      const itemA = screen.getByRole('option', { name: 'a' });

      await act(async () => itemA.focus());
      expect(itemA).toHaveAttribute('data-highlighted');

      await setProps({ items: ['b', 'a', 'c'] });

      expect(itemA).toHaveFocus();
      expect(itemA).toHaveAttribute('data-highlighted');
      expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-highlighted');

      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('option', { name: 'c' })).toHaveFocus();
    });
  });

  describe('tab stop', () => {
    function renderList(rootProps: Listbox.Root.Props<string> = {}) {
      return render(
        <div>
          <button>Before</button>
          <Listbox.Root {...rootProps}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        </div>,
      );
    }

    it.each([
      { name: 'the selected item', rootProps: { defaultValue: 'c' }, expected: 'c' },
      { name: 'the first item when nothing is selected', rootProps: {}, expected: 'a' },
    ])('focuses $name when tabbing into the list', async ({ rootProps, expected }) => {
      const { user } = await renderList(rootProps);
      await act(async () => screen.getByRole('button', { name: 'Before' }).focus());

      await user.keyboard('{Tab}');

      expect(screen.getByRole('option', { name: expected })).toHaveFocus();
    });

    it.each([
      { name: 'the selected item', rootProps: { defaultValue: 'c' }, expected: 'c' },
      { name: 'the first item when nothing is selected', rootProps: {}, expected: 'a' },
    ])('moves focus from the list to $name', async ({ rootProps, expected }) => {
      await renderList(rootProps);
      const list = screen.getByRole('listbox');

      await act(async () => list.focus());

      expect(screen.getByRole('option', { name: expected })).toHaveFocus();
    });

    it('leaves the list with Shift+Tab from an item', async () => {
      const { user } = await renderList();
      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());

      await user.keyboard('{Shift>}{Tab}{/Shift}');

      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    });

    it('moves the tab stop to the selected item when the items load', async () => {
      function App({ items }: { items: string[] }) {
        return (
          <Listbox.Root defaultValue="c">
            <Listbox.List>
              {items.map((item) => (
                <Listbox.Item key={item} value={item}>
                  {item}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }
      const { setProps } = await render(<App items={[]} />);

      await setProps({ items: ['a', 'b', 'c'] });

      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('tabindex', '0');
    });

    it('keeps the tab stop on the selected item when an item is added before it', async () => {
      function App({ items }: { items: string[] }) {
        return (
          <Listbox.Root defaultValue="c">
            <Listbox.List>
              {items.map((item) => (
                <Listbox.Item key={item} value={item}>
                  {item}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }
      const { setProps } = await render(<App items={['b', 'c']} />);
      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('tabindex', '0');

      await setProps({ items: ['a', 'b', 'c'] });

      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('tabindex', '-1');
    });

    it('moves the tab stop to the last item when the focused last item is removed', async () => {
      function RemovableList(props: { names: string[] }) {
        return (
          <Listbox.Root>
            <Listbox.List>
              {props.names.map((name) => (
                <Listbox.Item key={name} value={name}>
                  {name}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }

      const { setProps } = await render(<RemovableList names={['a', 'b', 'c']} />);
      const itemC = screen.getByRole('option', { name: 'c' });
      await act(async () => itemC.focus());
      expect(itemC).toHaveAttribute('tabindex', '0');

      await setProps({ names: ['a', 'b'] });

      const options = screen.getAllByRole('option');
      expect(options.map((option) => option.getAttribute('tabindex'))).toEqual(['-1', '0']);
      expect(options[1]).toHaveFocus();

      fireEvent.keyDown(options[1], { key: 'ArrowUp' });

      expect(options[0]).toHaveFocus();
    });

    it('moves the tab stop to a newly selected item while the list does not have focus', async () => {
      const { setProps } = await render(
        <Listbox.Root value="a">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('tabindex', '0');

      await setProps({ value: 'b' });

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('tabindex', '-1');
    });

    it.each([
      { name: 'the selected item', rootProps: { defaultValue: 'a' }, expected: 'a' },
      { name: 'the first item when nothing is selected', rootProps: {}, expected: 'a' },
      {
        name: 'the first selected item with multiple selection',
        rootProps: { multiple: true, defaultValue: ['d', 'b'] },
        expected: 'b',
      },
    ])('returns focus to $name when tabbing back in', async ({ rootProps, expected }) => {
      const { user } = await render(
        <div>
          <Listbox.Root {...(rootProps as Listbox.Root.Props<string, boolean>)}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
              <Listbox.Item value="d">d</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
          <button>Outside</button>
        </div>,
      );
      const itemC = screen.getByRole('option', { name: 'c' });

      await act(async () => itemC.focus());
      expect(itemC).toHaveAttribute('tabindex', '0');

      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(screen.getByRole('option', { name: expected })).toHaveFocus();
    });
  });

  describe('hover highlight', () => {
    it('moves focus to the hovered item without scrolling the list', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      const focusSpy = vi.spyOn(itemB, 'focus');
      fireEvent.mouseMove(itemB);

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });

    function renderListWithOutsideButton(highlightItemOnHover?: boolean) {
      return render(
        <div>
          <Listbox.Root highlightItemOnHover={highlightItemOnHover}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
          <button>Outside</button>
        </div>,
      );
    }

    it('moves focus and the highlight to a hovered item when focus is in the list', async () => {
      await renderListWithOutsideButton();
      const itemA = screen.getByRole('option', { name: 'a' });
      const itemB = screen.getByRole('option', { name: 'b' });

      await act(async () => itemA.focus());
      expect(itemA).toHaveAttribute('data-highlighted');

      fireEvent.mouseMove(itemB);

      expect(itemB).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');
      expect(itemA).not.toHaveAttribute('data-highlighted');
    });

    it('highlights a hovered item without taking focus when focus is outside the list', async () => {
      await renderListWithOutsideButton();
      const outside = screen.getByRole('button', { name: 'Outside' });
      const itemB = screen.getByRole('option', { name: 'b' });

      await act(async () => outside.focus());

      fireEvent.mouseMove(itemB);

      expect(outside).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');
    });

    it.each([
      { name: 'single selection', rootProps: { defaultValue: 'c' } },
      { name: 'opt-in mode', rootProps: { multiple: 'opt-in', defaultValue: ['c'] } },
    ])(
      'moves the highlight from a hovered item to an item that receives focus with $name',
      async ({ rootProps }) => {
        await render(
          <div>
            <button>Before</button>
            <Listbox.Root {...(rootProps as Listbox.Root.Props<string, boolean | 'opt-in'>)}>
              <Listbox.List>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
                <Listbox.Item value="c">c</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>
          </div>,
        );
        await act(async () => screen.getByRole('button', { name: 'Before' }).focus());
        const itemB = screen.getByRole('option', { name: 'b' });
        const itemC = screen.getByRole('option', { name: 'c' });
        fireEvent.mouseMove(itemB);
        expect(itemB).toHaveAttribute('data-highlighted');

        await act(async () => itemC.focus());

        expect(itemC).toHaveAttribute('data-highlighted');
        expect(itemB).not.toHaveAttribute('data-highlighted');
      },
    );

    function renderOptInList() {
      return render(
        <Listbox.Root multiple="opt-in">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    }

    it('highlights a hovered item without moving focus in opt-in mode', async () => {
      await renderOptInList();
      const itemA = screen.getByRole('option', { name: 'a' });
      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemA.focus());

      fireEvent.mouseMove(itemB);

      expect(itemA).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');
      expect(itemA).not.toHaveAttribute('data-highlighted');
    });

    it('returns the highlight to the focused item on a key press', async () => {
      await renderOptInList();
      const itemA = screen.getByRole('option', { name: 'a' });
      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemA.focus());
      fireEvent.mouseMove(itemB);
      expect(itemB).toHaveAttribute('data-highlighted');

      fireEvent.keyDown(itemA, { key: 'Shift' });

      expect(itemA).toHaveAttribute('data-highlighted');
      expect(itemB).not.toHaveAttribute('data-highlighted');
    });

    it('removes the hover highlight when the pointer leaves the list', async () => {
      await renderListWithOutsideButton();
      const itemB = screen.getByRole('option', { name: 'b' });

      fireEvent.mouseMove(itemB);
      expect(itemB).toHaveAttribute('data-highlighted');

      fireEvent.mouseLeave(screen.getByRole('listbox'));

      expect(itemB).not.toHaveAttribute('data-highlighted');
    });

    describe('prop: highlightItemOnHover', () => {
      it.each([
        { name: 'highlights', highlightItemOnHover: true },
        { name: 'does not highlight', highlightItemOnHover: false },
      ])('$name a hovered item when $highlightItemOnHover', async ({ highlightItemOnHover }) => {
        await renderListWithOutsideButton(highlightItemOnHover);
        const itemB = screen.getByRole('option', { name: 'b' });

        fireEvent.mouseMove(itemB);

        expect(itemB.hasAttribute('data-highlighted')).toBe(highlightItemOnHover);
      });
    });
  });

  describe('single selection', () => {
    it('should select an item on click and deselect previous', async () => {
      function TestComponent() {
        const [value, setValue] = React.useState<string | null>('a');
        return (
          <Listbox.Root value={value} onValueChange={(v) => setValue(v)}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      await render(<TestComponent />);

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');

      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });

  describe('multiple selection', () => {
    it('should toggle items on click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');

      // Add item b
      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      const firstCallValue = handleValueChange.mock.calls[0][0];
      expect(firstCallValue).toEqual(['a', 'b']);

      // Toggle item a off
      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      const secondCallValue = handleValueChange.mock.calls[1][0];
      expect(secondCallValue).toEqual(['b']);
    });
  });

  describe('prop: multiple', () => {
    it('keeps the selection when plain arrow keys move focus', async () => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());

      fireEvent.keyDown(itemB, { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('data-highlighted');
      expect(handleValueChange).not.toHaveBeenCalled();
    });

    describe('when it changes with an uncontrolled value', () => {
      function TestListbox(props: {
        multiple: boolean;
        defaultValue: string | string[];
        onValueChange: (value: any) => void;
      }) {
        return (
          <Listbox.Root<string, boolean> {...props}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      it('keeps the selected item selected when set to true', async () => {
        const handleValueChange = vi.fn();
        const { setProps, user } = await render(
          <TestListbox multiple={false} defaultValue="a" onValueChange={handleValueChange} />,
        );
        expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true');

        await setProps({ multiple: true });

        expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true');

        await user.click(screen.getByRole('option', { name: 'b' }));

        expect(handleValueChange.mock.lastCall?.[0]).toEqual(['a', 'b']);
      });

      it('keeps the first selected item selected when set to false', async () => {
        const handleValueChange = vi.fn();
        const { setProps, user } = await render(
          <TestListbox multiple defaultValue={['b', 'c']} onValueChange={handleValueChange} />,
        );
        expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('aria-selected', 'true');

        await setProps({ multiple: false });

        expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('aria-selected', 'false');

        await user.click(screen.getByRole('option', { name: 'a' }));

        expect(handleValueChange.mock.lastCall?.[0]).toBe('a');
      });
    });
  });

  describe('prop: multiple="opt-in"', () => {
    it('should replace the selection on plain click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'c' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
    });

    it('should toggle items on Ctrl/Cmd+Click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemC = screen.getByRole('option', { name: 'c' });

      fireEvent.click(itemC, { ctrlKey: true });
      fireEvent.click(itemC, { metaKey: true });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'b']);
    });

    function renderOptIn(
      props: Partial<Listbox.Root.Props<string, 'opt-in'>> = {},
      onValueChange = vi.fn(),
    ) {
      return render(
        <Listbox.Root multiple="opt-in" onValueChange={onValueChange} {...props}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    }

    it('moves the selection with focus on plain arrow keys', async () => {
      const handleValueChange = vi.fn();
      await renderOptIn({ defaultValue: ['a', 'b'] }, handleValueChange);

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());
      expect(itemB).toHaveAttribute('data-highlighted');

      fireEvent.keyDown(itemB, { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('data-highlighted');
      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
    });

    it.each([
      { name: 'Ctrl', modifier: { ctrlKey: true } },
      { name: 'Cmd', modifier: { metaKey: true } },
    ])('moves focus without changing the selection on $name+arrow keys', async ({ modifier }) => {
      const handleValueChange = vi.fn();
      await renderOptIn({ defaultValue: ['a'] }, handleValueChange);

      const itemA = screen.getByRole('option', { name: 'a' });
      await act(async () => itemA.focus());
      expect(itemA).toHaveAttribute('data-highlighted');

      fireEvent.keyDown(itemA, { key: 'ArrowDown', ...modifier });
      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      expect(itemB).toHaveAttribute('data-highlighted');
      expect(handleValueChange).not.toHaveBeenCalled();

      fireEvent.keyDown(itemB, { key: ' ', ctrlKey: true });
      fireEvent.keyUp(itemB, { key: ' ', ctrlKey: true });
      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b']);
    });

    it('moves the selection when Home and End move focus', async () => {
      const handleValueChange = vi.fn();
      await renderOptIn({ defaultValue: ['b'] }, handleValueChange);

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());

      fireEvent.keyDown(itemB, { key: 'End' });
      await flushMicrotasks();
      fireEvent.keyDown(screen.getByRole('option', { name: 'c' }), { key: 'Home' });
      await flushMicrotasks();

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['c'], ['a']]);
    });

    it('keeps the selection while focus passes over a disabled item', async () => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      fireEvent.keyDown(screen.getByRole('option', { name: 'a' }), { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
      expect(handleValueChange).not.toHaveBeenCalled();

      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['c']]);
    });

    it('moves the selection to the item a typed character moves focus to', async () => {
      const handleValueChange = vi.fn();
      const { user } = await renderOptIn({ defaultValue: ['a'] }, handleValueChange);

      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      await user.keyboard('c');

      expect(screen.getByRole('option', { name: 'c' })).toHaveFocus();
      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['c']]);
    });

    it('toggles items on touch tap, like multiple', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemC = screen.getByRole('option', { name: 'c' });
      fireEvent.pointerDown(itemC, { pointerType: 'touch' });
      fireEvent.click(itemC, { detail: 1 });

      const itemA = screen.getByRole('option', { name: 'a' });
      fireEvent.pointerDown(itemA, { pointerType: 'touch' });
      fireEvent.click(itemA, { detail: 1 });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['b', 'c']);
    });

    it('replaces the selection on Space after a touch tap on the same item', async () => {
      const handleValueChange = vi.fn();

      const { user } = await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.pointerDown(itemB, { pointerType: 'touch' });
      fireEvent.click(itemB, { detail: 1 });
      await act(async () => itemB.focus());
      await user.keyboard(' ');

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['a', 'b'], ['b']]);
    });

    it('replaces the selection on Enter after a touch press that ended without a click', async () => {
      const handleValueChange = vi.fn();

      const { user } = await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemB = screen.getByRole('option', { name: 'b' });
      // A touch that turns into a scroll is canceled and never clicks.
      fireEvent.pointerDown(itemB, { pointerType: 'touch' });
      fireEvent.pointerCancel(itemB, { pointerType: 'touch' });
      await act(async () => itemB.focus());
      await user.keyboard('{Enter}');

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['b']]);
    });

    it('replaces the selection on a click without a pointer press after a touch tap', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.pointerDown(itemB, { pointerType: 'touch' });
      fireEvent.click(itemB, { detail: 1 });
      // A click from assistive technology arrives without a pointer press.
      fireEvent.click(itemB);

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['a', 'b'], ['b']]);
    });

    it('should preserve existing selections outside the range on Ctrl+Shift+Click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
            <Listbox.Item value="e">e</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'c' }), { ctrlKey: true });
      fireEvent.click(screen.getByRole('option', { name: 'e' }), {
        ctrlKey: true,
        shiftKey: true,
      });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'c', 'd', 'e']);
    });
  });

  describe('ARIA attributes', () => {
    it('should render role="listbox" on the list', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should render role="option" on items', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'a' })).toBeInTheDocument();
    });

    it.each([
      { name: 'multiple', multiple: true },
      { name: 'opt-in mode', multiple: 'opt-in' as const },
    ])('should set aria-multiselectable with $name', async ({ multiple }) => {
      await render(
        <Listbox.Root multiple={multiple}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('does not set aria-multiselectable or aria-disabled on an enabled single-selection list', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      expect(list).not.toHaveAttribute('aria-multiselectable');
      expect(list).not.toHaveAttribute('aria-disabled');
    });

    it('should set aria-selected on selected items', async () => {
      await render(
        <Listbox.Root defaultValue="a">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('aria-selected', 'false');
    });

    it('should set aria-orientation', async () => {
      await render(
        <Listbox.Root orientation="horizontal">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });

  describe('keyboard navigation', () => {
    it.each([
      { name: 'ArrowDown', init: { key: 'ArrowDown' }, prevented: true },
      { name: 'Shift+ArrowDown', init: { key: 'ArrowDown', shiftKey: true }, prevented: true },
      { name: 'ArrowRight', init: { key: 'ArrowRight' }, prevented: false },
    ])(
      'prevents the default action of $name on the last item: $prevented',
      async ({ init, prevented }) => {
        await render(
          <Listbox.Root multiple>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );
        const itemB = screen.getByRole('option', { name: 'b' });
        await act(async () => itemB.focus());

        const notPrevented = fireEvent.keyDown(itemB, init);

        expect(notPrevented).toBe(!prevented);
        expect(itemB).toHaveFocus();
      },
    );

    it('should move highlight with arrow keys', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');

      await act(async () => list.focus());

      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      expect(itemB).toHaveAttribute('data-highlighted', '');
    });

    it('should select item with Enter key', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      // Navigate to item b
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.keyDown(itemB, { key: 'Enter' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledWith('b', expect.anything());
    });

    it('should select item with Space key', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      // Navigate to item b
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.keyDown(itemB, { key: ' ' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledWith('b', expect.anything());
    });
  });

  describe('items that share a value', () => {
    it('moves focus from the focused item, not from the first item with its value', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="same">one</Listbox.Item>
            <Listbox.Item value="same">two</Listbox.Item>
            <Listbox.Item value="same">three</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await act(async () => screen.getByRole('option', { name: 'three' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowUp' });

      expect(screen.getByRole('option', { name: 'two' })).toHaveFocus();
    });
  });

  describe('Shift+press before any other press', () => {
    it('extends the range from the first selected item', async () => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple defaultValue={['b', 'c']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
            <Listbox.Item value="e">e</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'e' }), { shiftKey: true });

      expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c', 'd', 'e']);
    });
  });

  describe('multi-select keyboard navigation', () => {
    it('Space toggles the focused option on consecutive presses', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // Navigate to item a
      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });

      // First Space selects b
      fireEvent.keyDown(itemB, { key: ' ' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b']);

      // Second Space deselects b (should not be blocked by typeahead)
      fireEvent.keyDown(itemB, { key: ' ' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual([]);
    });

    it('Shift+ArrowDown selects from the focused option to the next one, replacing the rest of the selection', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // ArrowDown from list moves to index 1 (item b)
      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });

      // Item b is focused and becomes the anchor; Shift+ArrowDown selects b–c
      fireEvent.keyDown(itemB, { key: 'ArrowDown', shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
    });

    it('Shift+Space selects contiguous items from most recently selected to focused', async () => {
      const handleValueChange = vi.fn();

      const { user } = await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await user.click(screen.getByRole('option', { name: 'b' }));
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b']);

      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(screen.getByRole('option', { name: 'd' })).toHaveFocus();
      expect(handleValueChange).toHaveBeenCalledTimes(1);

      await user.keyboard('{Shift>} {/Shift}');

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['b', 'c', 'd']);
    });

    it('Shift+Click replaces existing selections outside the range', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
            <Listbox.Item value="e">e</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // Click "a" to select it
      fireEvent.click(screen.getByRole('option', { name: 'a' }));
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a']);

      // Click "e" to also toggle it on
      fireEvent.click(screen.getByRole('option', { name: 'e' }));
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'e']);

      // Click "c" to set the anchor
      fireEvent.click(screen.getByRole('option', { name: 'c' }));
      expect(handleValueChange.mock.calls[2][0]).toEqual(['a', 'e', 'c']);

      // Shift+Click "d" — should select range c→d only, dropping "a" and "e"
      fireEvent.click(screen.getByRole('option', { name: 'd' }), { shiftKey: true });
      expect(handleValueChange.mock.calls[3][0]).toEqual(['c', 'd']);
    });

    it('Ctrl+Shift+Home selects focused option and all options up to the first', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // ArrowDown from list goes to index 1, then ArrowDown to index 2 (item c)
      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.keyDown(itemB, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });

      // Item c is now focused; Ctrl+Shift+Home: select a, b, c
      fireEvent.keyDown(itemC, { key: 'Home', ctrlKey: true, shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Ctrl+Shift+End selects focused option and all options down to the last', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // ArrowDown from list goes to index 1 (item b)
      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });

      // Item b is now focused; Ctrl+Shift+End: select b, c, d
      fireEvent.keyDown(itemB, { key: 'End', ctrlKey: true, shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c', 'd']);
    });

    it('Ctrl+A selects all options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Escape keeps the selection and its default action', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      const notPrevented = fireEvent.keyDown(document.activeElement as HTMLElement, {
        key: 'Escape',
      });

      expect(notPrevented).toBe(true);
      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('Ctrl+A ignores disabled options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
    });

    it('Ctrl+Shift+Home ignores disabled options in the selected range', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });
      fireEvent.keyDown(itemC, { key: 'Home', ctrlKey: true, shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
    });

    it('ArrowDown moves focus to a disabled option', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
    });

    it('Shift+Arrow grows and shrinks a range from the focused item', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      await act(async () => option('a').focus());

      fireEvent.keyDown(option('a'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('b'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('c'), { key: 'ArrowUp', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('b'), { key: 'ArrowUp', shiftKey: true });
      await flushMicrotasks();

      expect(option('a')).toHaveAttribute('data-highlighted');
      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([
        ['a', 'b'],
        ['a', 'b', 'c'],
        ['a', 'b'],
        ['a'],
      ]);
    });

    it('Shift+Arrow starts a new range after an arrow key moved focus without Shift', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      await act(async () => option('a').focus());

      fireEvent.keyDown(option('a'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('b'), { key: 'ArrowDown' });
      await flushMicrotasks();
      fireEvent.keyDown(option('c'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });

    it('Shift+Arrow starts from the item the selection moved to by typing, in opt-in mode', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="Apple">Apple</Listbox.Item>
            <Listbox.Item value="Banana">Banana</Listbox.Item>
            <Listbox.Item value="Cherry">Cherry</Listbox.Item>
            <Listbox.Item value="Date">Date</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      fireEvent.click(option('Apple'));
      await act(async () => option('Apple').focus());
      fireEvent.click(option('Banana'), { shiftKey: true });
      await act(async () => option('Banana').focus());
      // Typing moves the selection to Cherry alone.
      fireEvent.keyDown(option('Banana'), { key: 'C', shiftKey: true });
      await flushMicrotasks();
      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['Cherry']);

      fireEvent.keyDown(option('Cherry'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['Cherry', 'Date']);
    });

    it('Shift+Arrow continues a range made with Shift+Click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      fireEvent.click(option('a'));
      await act(async () => option('c').focus());
      fireEvent.click(option('c'), { shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('c'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('d'), { key: 'ArrowUp', shiftKey: true });
      await flushMicrotasks();

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([
        ['a'],
        ['a', 'b', 'c'],
        ['a', 'b', 'c', 'd'],
        ['a', 'b', 'c'],
      ]);
    });

    it('Shift+Arrow starts a new range from the focused item after typing moved focus', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="Apple">Apple</Listbox.Item>
            <Listbox.Item value="Cherry">Cherry</Listbox.Item>
            <Listbox.Item value="Banana">Banana</Listbox.Item>
            <Listbox.Item value="Fig">Fig</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      await act(async () => option('Apple').focus());

      fireEvent.keyDown(option('Apple'), { key: 'B', shiftKey: true });
      await flushMicrotasks();
      expect(option('Banana')).toHaveFocus();

      fireEvent.keyDown(option('Banana'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['Banana', 'Fig']);
    });

    it('moves focus without the selection when the change is canceled during opt-in navigation', async () => {
      const handleValueChange = vi.fn(
        (_value: string[], eventDetails: Listbox.Root.ChangeEventDetails) => {
          eventDetails.cancel();
        },
      );

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      await act(async () => option('a').focus());
      fireEvent.keyDown(option('a'), { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(option('b')).toHaveFocus();
      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['b']]);
      expect(option('a')).toHaveAttribute('aria-selected', 'true');
      expect(option('b')).toHaveAttribute('aria-selected', 'false');
    });

    it('Shift+Click extends from the last applied press after a canceled one', async () => {
      const handleValueChange = vi.fn(
        (value: string[], eventDetails: Listbox.Root.ChangeEventDetails) => {
          if (value.includes('e')) {
            eventDetails.cancel();
          }
        },
      );

      await render(
        <Listbox.Root multiple onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
            <Listbox.Item value="e">e</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      fireEvent.click(option('b'));
      fireEvent.click(option('e'));
      fireEvent.click(option('c'), { shiftKey: true });

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['b', 'c']);
    });

    it('passes a new array when a range selects nothing', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['c']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a" disabled>
              a
            </Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      await act(async () => option('a').focus());
      fireEvent.keyDown(option('a'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();

      expect(handleValueChange.mock.lastCall?.[0]).toEqual([]);
      expect(Object.isFrozen(handleValueChange.mock.lastCall?.[0])).toBe(false);
    });

    it.each([
      { name: 'Space', key: ' ' },
      { name: 'Enter', key: 'Enter' },
    ])('toggles an item once while $name is held', async ({ key }) => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemA = screen.getByRole('option', { name: 'a' });
      await act(async () => itemA.focus());
      fireEvent.keyDown(itemA, { key });
      fireEvent.keyDown(itemA, { key, repeat: true });
      fireEvent.keyDown(itemA, { key, repeat: true });
      fireEvent.keyUp(itemA, { key });

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['a']]);
    });

    it('presses an item with a click after a held Space is released', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemA = screen.getByRole('option', { name: 'a' });
      await act(async () => itemA.focus());
      fireEvent.keyDown(itemA, { key: ' ' });
      fireEvent.keyDown(itemA, { key: ' ', repeat: true });
      fireEvent.keyUp(itemA, { key: ' ' });
      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['a']]);

      fireEvent.click(itemA, { detail: 1 });

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['a'], []]);
    });

    it('Shift+ArrowDown focuses disabled options without selecting them', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemA = screen.getByRole('option', { name: 'a' });
      await act(() => itemA.focus());
      fireEvent.keyDown(itemA, { key: 'ArrowDown', shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
    });

    it('Meta+A (Cmd+A) selects all options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', metaKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Ctrl+Shift+Home preserves existing selections outside the range', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['d']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await act(async () => screen.getByRole('option', { name: 'c' }).focus());

      // Ctrl+Shift+Home: select a, b, c; d should remain selected
      fireEvent.keyDown(screen.getByRole('option', { name: 'c' }), {
        key: 'Home',
        ctrlKey: true,
        shiftKey: true,
      });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['d', 'a', 'b', 'c']);
    });

    describe('horizontal orientation', () => {
      it('Shift+ArrowRight extends the selection to the next option', async () => {
        const handleValueChange = vi.fn();

        await render(
          <Listbox.Root
            multiple
            orientation="horizontal"
            defaultValue={[]}
            onValueChange={handleValueChange}
          >
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );

        const list = screen.getByRole('listbox');
        await act(async () => list.focus());
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowRight toggles c
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowRight',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
      });

      it('Shift+ArrowDown does not select in horizontal orientation', async () => {
        const handleValueChange = vi.fn();

        await render(
          <Listbox.Root
            multiple
            orientation="horizontal"
            defaultValue={[]}
            onValueChange={handleValueChange}
          >
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );

        const list = screen.getByRole('listbox');
        await act(async () => list.focus());
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowDown should not trigger selection
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowDown',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).not.toHaveBeenCalled();
      });
    });

    describe('horizontal RTL orientation', () => {
      it('Shift+ArrowLeft extends the selection to the next option in RTL', async () => {
        const handleValueChange = vi.fn();

        await render(
          <DirectionProvider direction="rtl">
            <Listbox.Root
              multiple
              orientation="horizontal"
              defaultValue={[]}
              onValueChange={handleValueChange}
            >
              <Listbox.List>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
                <Listbox.Item value="c">c</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>
          </DirectionProvider>,
        );

        const list = screen.getByRole('listbox');
        await act(async () => list.focus());
        // In RTL, ArrowLeft moves forward (next)
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowLeft toggles c (next in RTL)
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowLeft',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
      });
    });
  });

  describe('disabled', () => {
    it('keeps a selected disabled item selected when Shift+Click replaces the selection', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Listbox.Root multiple defaultValue={['b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await user.click(screen.getByRole('option', { name: 'c' }));
      await user.keyboard('{Shift>}');
      await user.click(screen.getByRole('option', { name: 'd' }));
      await user.keyboard('{/Shift}');

      expect(handleValueChange).toHaveBeenLastCalledWith(['c', 'd', 'b'], expect.anything());
    });

    it('keeps a selected disabled item selected when Ctrl+A selects all', async () => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple defaultValue={['b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c" disabled>
              c
            </Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await act(async () => screen.getByRole('option', { name: 'a' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b']);
    });

    it.each([
      { name: 'Enter', key: 'Enter' },
      { name: 'Space', key: ' ' },
    ])('does not select a focused disabled item on $name', async ({ key }) => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());
      expect(itemB).toHaveAttribute('data-highlighted');

      fireEvent.keyDown(itemB, { key });
      fireEvent.keyUp(itemB, { key });
      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('should not allow selection on disabled items', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a" disabled>
              a
            </Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('ignores a press on a disabled item, so a range still extends from the earlier press', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a" disabled>
              a
            </Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      fireEvent.click(option('c'));
      fireEvent.click(option('a'));
      fireEvent.click(option('d'), { shiftKey: true });

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['c', 'd']);
    });

    it('should not include disabled items in Shift+Click ranges', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'a' }));
      fireEvent.click(screen.getByRole('option', { name: 'c' }), { shiftKey: true });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'c']);
    });
  });

  describe('prop: disabled', () => {
    it('removes the highlight from the focused item when the listbox becomes disabled', async () => {
      function App(props: { disabled: boolean }) {
        return (
          <Listbox.Root disabled={props.disabled}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      const { setProps } = await render(<App disabled={false} />);
      await act(async () => screen.getByRole('option', { name: 'b' }).focus());
      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted');

      await setProps({ disabled: true });

      expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-highlighted');
    });

    function renderDisabledList(props: Partial<Listbox.Root.Props<string, true>> = {}) {
      return render(
        <Listbox.Root multiple disabled defaultValue={['a']} {...props}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    }

    it('does not select an item on click', async () => {
      const handleValueChange = vi.fn();
      const { user } = await renderDisabledList({ onValueChange: handleValueChange });

      await user.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('marks the list and its items as disabled and takes them out of the tab order', async () => {
      await renderDisabledList();

      const list = screen.getByRole('listbox');
      expect(list).toHaveAttribute('aria-disabled', 'true');
      expect(list).toHaveAttribute('data-disabled');
      expect(list).not.toHaveAttribute('tabindex');
      const options = screen.getAllByRole('option');
      expect(options.map((option) => option.getAttribute('aria-disabled'))).toEqual([
        'true',
        'true',
        'true',
      ]);
      expect(options.map((option) => option.hasAttribute('data-disabled'))).toEqual([
        true,
        true,
        true,
      ]);
      expect(options.map((option) => option.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1']);
    });

    it('does not highlight items on hover', async () => {
      await renderDisabledList();
      const itemB = screen.getByRole('option', { name: 'b' });

      fireEvent.mouseMove(itemB);

      expect(itemB).not.toHaveAttribute('data-highlighted');
    });

    it.each([
      { name: 'ArrowDown', init: { key: 'ArrowDown' } },
      { name: 'End', init: { key: 'End' } },
      { name: 'Shift+ArrowDown', init: { key: 'ArrowDown', shiftKey: true } },
      { name: 'a typed character', init: { key: 'c' } },
      { name: 'Ctrl+A', init: { key: 'a', ctrlKey: true } },
      { name: 'Enter', init: { key: 'Enter' } },
      { name: 'Space', init: { key: ' ' } },
    ])('ignores $name', async ({ init }) => {
      const handleValueChange = vi.fn();
      const handleItemHighlighted = vi.fn();
      await renderDisabledList({
        onValueChange: handleValueChange,
        onItemHighlighted: handleItemHighlighted,
      });

      // A press can still put focus on an item of a disabled list.
      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());

      fireEvent.keyDown(itemB, init);
      fireEvent.keyUp(itemB, init);
      await flushMicrotasks();

      expect(itemB).toHaveFocus();
      expect(handleValueChange).not.toHaveBeenCalled();
      expect(handleItemHighlighted).not.toHaveBeenCalled();
    });
  });

  describe('groups', () => {
    it('should render groups with correct ARIA', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Group>
              <Listbox.GroupLabel>Fruits</Listbox.GroupLabel>
              <Listbox.Item value="apple">Apple</Listbox.Item>
            </Listbox.Group>
          </Listbox.List>
        </Listbox.Root>,
      );

      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-labelledby');

      const labelId = group.getAttribute('aria-labelledby');
      const label = document.getElementById(labelId!);
      expect(label).toHaveTextContent('Fruits');
    });
  });

  describe('typeahead', () => {
    it('matches the label prop instead of the rendered text', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="kiwi" label="Kiwi">
              <span>Green</span> <span>Kiwi</span>
            </Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'k' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Green Kiwi' })).toHaveAttribute(
        'data-highlighted',
        '',
      );
    });

    it('should highlight matching item when typing', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="banana">Banana</Listbox.Item>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'b' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'data-highlighted',
        '',
      );
    });

    it('should match multi-character typeahead', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
            <Listbox.Item value="chocolate">Chocolate</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      // Each typed character may move focus to a new item, so type into whichever item has focus.
      for (const key of ['c', 'h', 'o']) {
        fireEvent.keyDown(document.activeElement as HTMLElement, { key });
        // eslint-disable-next-line no-await-in-loop
        await flushMicrotasks();
      }

      expect(screen.getByRole('option', { name: 'Chocolate' })).toHaveAttribute(
        'data-highlighted',
        '',
      );
    });

    describe('other key handlers', () => {
      function renderList(props: {
        onListKeyDown?: React.KeyboardEventHandler;
        onItemKeyDown?: React.KeyboardEventHandler;
      }) {
        return render(
          <Listbox.Root>
            <Listbox.List onKeyDown={props.onListKeyDown}>
              <Listbox.Item value="apple" onKeyDown={props.onItemKeyDown}>
                Apple
              </Listbox.Item>
              <Listbox.Item value="banana">Banana</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );
      }

      it('lets a key that matches no item reach handlers on the item, the list and outside', async () => {
        const handleItemKeyDown = vi.fn();
        const handleListKeyDown = vi.fn();
        const handleDocumentKeyDown = vi.fn();
        document.addEventListener('keydown', handleDocumentKeyDown);

        try {
          const { user } = await renderList({
            onItemKeyDown: handleItemKeyDown,
            onListKeyDown: handleListKeyDown,
          });
          await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
          await user.keyboard('x');

          expect(handleItemKeyDown).toHaveBeenCalledTimes(1);
          expect(handleListKeyDown).toHaveBeenCalledTimes(1);
          expect(handleDocumentKeyDown).toHaveBeenCalledTimes(1);
        } finally {
          document.removeEventListener('keydown', handleDocumentKeyDown);
        }
      });

      it('keeps a key that matches an item from reaching handlers outside the list', async () => {
        const handleDocumentKeyDown = vi.fn();
        document.addEventListener('keydown', handleDocumentKeyDown);

        try {
          const { user } = await renderList({});
          await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
          await user.keyboard('b');

          expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();
          expect(handleDocumentKeyDown).not.toHaveBeenCalled();
        } finally {
          document.removeEventListener('keydown', handleDocumentKeyDown);
        }
      });

      it.each([
        { name: 'ArrowDown', key: '{ArrowDown}', prevent: true, focused: 'Apple' },
        { name: 'ArrowDown', key: '{ArrowDown}', prevent: false, focused: 'Banana' },
        { name: 'a typed character', key: 'b', prevent: true, focused: 'Apple' },
        { name: 'a typed character', key: 'b', prevent: false, focused: 'Banana' },
      ])(
        'handles $name unless an item handler calls preventBaseUIHandler: $prevent',
        async ({ key, prevent, focused }) => {
          const { user } = await renderList({
            onItemKeyDown(event) {
              if (prevent) {
                (event as BaseUIEvent<React.KeyboardEvent>).preventBaseUIHandler();
              }
            },
          });
          await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
          await user.keyboard(key);

          expect(screen.getByRole('option', { name: focused })).toHaveFocus();
        },
      );

      it.each([
        { name: 'does not match', prevent: true, focused: 'Apple' },
        { name: 'matches', prevent: false, focused: 'Banana' },
      ])(
        '$name an item when a list handler calls preventBaseUIHandler: $prevent',
        async ({ prevent, focused }) => {
          const { user } = await renderList({
            onListKeyDown(event) {
              if (prevent) {
                (event as BaseUIEvent<React.KeyboardEvent>).preventBaseUIHandler();
              }
            },
          });
          await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
          await user.keyboard('b');

          expect(screen.getByRole('option', { name: focused })).toHaveFocus();
        },
      );
    });

    it('starts a new search after focus leaves the list', async () => {
      const { user } = await render(
        <div>
          <button>Outside</button>
          <Listbox.Root>
            <Listbox.List>
              <Listbox.Item value="apple">Apple</Listbox.Item>
              <Listbox.Item value="banana">Banana</Listbox.Item>
              <Listbox.Item value="cherry">Cherry</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        </div>,
      );

      await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
      await user.keyboard('b');
      expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();

      await act(async () => screen.getByRole('button', { name: 'Outside' }).focus());
      await act(async () => screen.getByRole('option', { name: 'Banana' }).focus());
      // Typed right away, this would continue the search as "bc" and match nothing.
      await user.keyboard('c');

      expect(screen.getByRole('option', { name: 'Cherry' })).toHaveFocus();
    });

    describe('typing session', () => {
      const { render: renderFakeTimers, clock } = createRenderer();

      clock.withFakeTimers();

      function renderFruits(rootProps: Listbox.Root.Props<string> = {}) {
        return renderFakeTimers(
          <Listbox.Root {...rootProps}>
            <Listbox.List>
              <Listbox.Item value="apple">Apple</Listbox.Item>
              <Listbox.Item value="banana">Banana</Listbox.Item>
              <Listbox.Item value="cherry">Cherry</Listbox.Item>
              <Listbox.Item value="bacon">Bacon</Listbox.Item>
              <Listbox.Item value="banana split">Banana split</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );
      }

      async function type(key: string) {
        fireEvent.keyDown(document.activeElement as HTMLElement, { key });
        await flushMicrotasks();
      }

      it('keeps the first match while it matches the whole search', async () => {
        await renderFruits();
        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());

        await type('b');
        expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();

        await type('a');
        expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();
      });

      it('starts a new search from the focused item after a pause', async () => {
        await renderFruits();
        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());

        await type('b');
        expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();

        // Without the pause, "ba" would keep Banana.
        clock.tick(500);
        await type('a');
        expect(screen.getByRole('option', { name: 'Apple' })).toHaveFocus();
      });

      it('selects with Space and starts a new search once the search has ended', async () => {
        const handleValueChange = vi.fn();
        await renderFruits({ onValueChange: handleValueChange });
        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());

        await type('b');
        expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();

        clock.tick(500);
        await type(' ');
        fireEvent.keyUp(document.activeElement as HTMLElement, { key: ' ' });
        expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual(['banana']);

        await type('c');
        expect(screen.getByRole('option', { name: 'Cherry' })).toHaveFocus();
      });

      it('cycles through matches when the same letter is typed again', async () => {
        await renderFruits();
        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());

        await type('b');
        await type('b');
        expect(screen.getByRole('option', { name: 'Bacon' })).toHaveFocus();
      });

      it('continues the search with Space instead of selecting', async () => {
        const handleValueChange = vi.fn();
        await renderFruits({ onValueChange: handleValueChange });
        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());

        for (const key of ['b', 'a', 'n', 'a', 'n', 'a', ' ', 's']) {
          // eslint-disable-next-line no-await-in-loop
          await type(key);
        }

        expect(screen.getByRole('option', { name: 'Banana split' })).toHaveFocus();
        expect(handleValueChange).not.toHaveBeenCalled();
      });
    });

    it.each([
      {
        name: 'Shift+Space selects a range with multiple selection',
        multiple: true as const,
        keys: '{Shift>} {/Shift}',
        expected: ['apple', 'banana', 'cherry'],
      },
      {
        name: 'Ctrl+Space toggles the focused item in opt-in mode',
        multiple: 'opt-in' as const,
        keys: '{Control>} {/Control}',
        expected: [],
      },
    ])('$name while a search is in progress', async ({ multiple, keys, expected }) => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <Listbox.Root multiple={multiple} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="banana">Banana</Listbox.Item>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
      await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());

      await user.keyboard('c');
      expect(screen.getByRole('option', { name: 'Cherry' })).toHaveFocus();
      handleValueChange.mockClear();

      await user.keyboard(keys);

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(expected);
    });
  });

  describe('focus at the ends of the list', () => {
    it('stays on the last item when pressing ArrowDown', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted', '');

      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted', '');
    });
  });

  describe('controlled value', () => {
    it('should update selection when value prop changes externally', async () => {
      function TestComponent() {
        const [value, setValue] = React.useState<string | null>('a');
        return (
          <div>
            <button type="button" onClick={() => setValue('b')}>
              switch
            </button>
            <Listbox.Root value={value} onValueChange={(v) => setValue(v)}>
              <Listbox.List>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>
          </div>
        );
      }

      await render(<TestComponent />);

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-selected');

      fireEvent.click(screen.getByRole('button', { name: 'switch' }));

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });

  describe('an item with a null value', () => {
    function NoneList(props: Listbox.Root.Props<string | null>) {
      return (
        <Listbox.Root {...props}>
          <Listbox.List>
            <Listbox.Item value={null}>None</Listbox.Item>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>
      );
    }

    it('is selected while the value is null', async () => {
      await render(<NoneList defaultValue="a" />);
      expect(screen.getByRole('option', { name: 'None' })).toHaveAttribute(
        'aria-selected',
        'false',
      );

      await render(<NoneList value={null} />);
      expect(screen.getAllByRole('option', { name: 'None' })[1]).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('becomes selected when pressed', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(
        <NoneList defaultValue="a" onValueChange={handleValueChange} />,
      );

      await user.click(screen.getByRole('option', { name: 'None' }));

      expect(handleValueChange.mock.calls[0][0]).toBe(null);
      expect(screen.getByRole('option', { name: 'None' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('selected values that are not in `items`', () => {
    function FilteredList(props: Partial<Listbox.Root.Props<string, true>>) {
      const items = ['c', 'd', 'e'];
      return (
        <Listbox.Root multiple items={items} defaultValue={['a']} {...props}>
          <Listbox.List>
            {items.map((item) => (
              <Listbox.Item key={item} value={item}>
                {item}
              </Listbox.Item>
            ))}
          </Listbox.List>
        </Listbox.Root>
      );
    }

    it('drops them when Ctrl+A selects every item', async () => {
      const handleValueChange = vi.fn();
      await render(<FilteredList onValueChange={handleValueChange} />);

      await act(async () => screen.getByRole('option', { name: 'c' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['c', 'd', 'e']);
    });

    it('drops them when Shift+Click selects a range', async () => {
      const handleValueChange = vi.fn();
      await render(<FilteredList onValueChange={handleValueChange} />);

      fireEvent.click(screen.getByRole('option', { name: 'c' }));
      fireEvent.click(screen.getByRole('option', { name: 'd' }), { shiftKey: true });

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['c', 'd']);
    });

    it('keeps them when Ctrl+Shift+End adds a range to the selection', async () => {
      const handleValueChange = vi.fn();
      await render(<FilteredList onValueChange={handleValueChange} />);

      await act(async () => screen.getByRole('option', { name: 'd' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, {
        key: 'End',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['a', 'd', 'e']);
    });
  });

  describe('focus on the list element', () => {
    // JSDOM has no `scrollIntoView`, so the item gets one to record the calls.
    function spyOnScrollIntoView(element: HTMLElement) {
      const scrollIntoView = vi.fn();
      element.scrollIntoView = scrollIntoView;
      return scrollIntoView;
    }

    function renderList() {
      return render(
        <Listbox.Root defaultValue="a">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    }

    it('passes focus to the tab stop without scrolling when it comes from a press', async () => {
      await renderList();
      const list = screen.getByRole('listbox');
      const itemA = screen.getByRole('option', { name: 'a' });
      const scrollSpy = spyOnScrollIntoView(itemA);

      // A press on a gap between items or on a group label focuses the list.
      fireEvent.pointerDown(list);
      await act(async () => list.focus());

      expect(itemA).toHaveFocus();
      expect(scrollSpy).not.toHaveBeenCalled();
    });

    it('passes focus to the tab stop and scrolls to it when it comes from elsewhere', async () => {
      await renderList();
      const list = screen.getByRole('listbox');
      const itemA = screen.getByRole('option', { name: 'a' });
      const scrollSpy = spyOnScrollIntoView(itemA);

      await act(async () => list.focus());

      expect(itemA).toHaveFocus();
      expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    });

    it.each([
      { name: 'the pointer was released', end: (list: HTMLElement) => fireEvent.pointerUp(list) },
      {
        name: 'the press was canceled',
        end: (list: HTMLElement) => fireEvent.pointerCancel(list),
      },
      {
        name: 'a key was pressed',
        end: () => fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Shift' }),
      },
      { name: 'focus left the list', end: (list: HTMLElement) => fireEvent.blur(list) },
    ])(
      'scrolls to the tab stop when the list receives focus after a press and $name',
      async ({ end }) => {
        await renderList();
        const list = screen.getByRole('listbox');
        const itemA = screen.getByRole('option', { name: 'a' });
        await act(async () => itemA.focus());
        const scrollSpy = spyOnScrollIntoView(itemA);

        fireEvent.pointerDown(list);
        end(list);
        await act(async () => list.focus());

        expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
      },
    );
  });

  describe.skipIf(isJSDOM)('scroll position', () => {
    it('stays where it was when a press focuses the list element', async () => {
      const names = Array.from({ length: 40 }, (_, index) => `item ${index}`);
      await render(
        <Listbox.Root defaultValue="item 0">
          <Listbox.List style={{ height: 100, overflow: 'auto' }}>
            {names.map((name) => (
              <Listbox.Item key={name} value={name} style={{ height: 20 }}>
                {name}
              </Listbox.Item>
            ))}
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.scrollTop = 400;
      expect(list.scrollTop).toBe(400);

      fireEvent.pointerDown(list);
      await act(async () => list.focus());

      expect(screen.getByRole('option', { name: 'item 0' })).toHaveFocus();
      expect(list.scrollTop).toBe(400);
    });

    it('scrolls by one item when an arrow key moves past the visible items', async () => {
      const names = Array.from({ length: 40 }, (_, index) => `item ${index}`);
      const { user } = await render(
        <Listbox.Root defaultValue="item 0">
          <Listbox.List style={{ height: 100, overflow: 'auto' }}>
            {names.map((name) => (
              <Listbox.Item key={name} value={name} style={{ height: 20 }}>
                {name}
              </Listbox.Item>
            ))}
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => screen.getByRole('option', { name: 'item 0' }).focus());

      // The first five items fit, so the list stays where it is until the sixth.
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(screen.getByRole('option', { name: 'item 4' })).toHaveFocus();
      expect(list.scrollTop).toBe(0);

      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('option', { name: 'item 5' })).toHaveFocus();
      expect(list.scrollTop).toBe(20);

      await user.keyboard('{ArrowDown}');
      expect(list.scrollTop).toBe(40);
    });
  });

  describe('range anchor when the items change', () => {
    it('extends a Shift+press range from the pressed item after an item before it is removed', async () => {
      const handleValueChange = vi.fn();
      function App(props: { names: string[] }) {
        return (
          <Listbox.Root multiple onValueChange={handleValueChange}>
            <Listbox.List>
              {props.names.map((name) => (
                <Listbox.Item key={name} value={name}>
                  {name}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }

      const { setProps } = await render(<App names={['a', 'b', 'c', 'd', 'e']} />);
      fireEvent.click(screen.getByRole('option', { name: 'b' }));
      await setProps({ names: ['b', 'c', 'd', 'e'] });
      fireEvent.click(screen.getByRole('option', { name: 'd' }), { shiftKey: true });

      expect(handleValueChange.mock.lastCall?.[0]).toEqual(['b', 'c', 'd']);
    });
  });

  describe('removing the focused item', () => {
    it.each([
      { name: 'before the removed item', selected: 'a' },
      { name: 'right after the removed item', selected: 'c' },
      { name: 'further after the removed item', selected: 'e' },
    ])(
      'moves focus to the item that took its position when the selected item is $name and the list has no `items`',
      async ({ selected }) => {
        function App(props: { names: string[] }) {
          return (
            <Listbox.Root defaultValue={selected}>
              <Listbox.List>
                {props.names.map((name) => (
                  <Listbox.Item key={name} value={name}>
                    {name}
                  </Listbox.Item>
                ))}
              </Listbox.List>
            </Listbox.Root>
          );
        }

        const { setProps } = await render(<App names={['a', 'b', 'c', 'd', 'e']} />);
        await act(async () => screen.getByRole('option', { name: 'b' }).focus());
        expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();

        await setProps({ names: ['a', 'c', 'd', 'e'] });

        const nextItem = screen.getByRole('option', { name: 'c' });
        expect(nextItem).toHaveFocus();
        expect(nextItem).toHaveAttribute('tabindex', '0');
      },
    );
  });

  describe('prop: items', () => {
    it.each([
      { name: 'an object that is not a collection', items: { sans: 'Sans-serif' } },
      { name: 'a string', items: 'sans' },
      { name: 'an array of objects', items: [{ value: 'sans', label: 'Sans-serif' }] },
      { name: 'an array of groups', items: [{ label: 'Fonts', items: ['sans'] }] },
    ])('throws when `items` is $name', async ({ items }) => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await expect(
          render(
            <Listbox.Root items={items as any}>
              <Listbox.List>
                <Listbox.Item value="sans">Sans-serif</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>,
          ),
        ).rejects.toThrow(/nor a collection/);
      } finally {
        errorSpy.mockRestore();
      }
    });

    const WINDOW_SIZE = 5;
    const ALL_ITEMS = Array.from({ length: 100 }, (_, index) => `Item ${index}`);

    // Renders a window of 5 of the items, like a virtualizer, and scrolls the highlighted item into
    // view unless `follow` is false.
    function VirtualList(
      props: Omit<Listbox.Root.Props<string, boolean | 'opt-in'>, 'items'> & {
        names?: string[];
        disabledNames?: string[];
        start?: number;
        follow?: boolean;
        /** Passes `names` as a plain array rather than a collection. */
        plain?: boolean;
      },
    ) {
      const {
        names = ALL_ITEMS,
        disabledNames,
        plain = false,
        start: startProp = 0,
        follow = true,
        onItemHighlighted,
        ...rootProps
      } = props;
      const items = React.useMemo(
        () =>
          Listbox.createItems(names, {
            getValue: (name) => name,
            getLabel: (name) => name,
            isDisabled: disabledNames ? (name) => disabledNames.includes(name) : undefined,
          }),
        [names, disabledNames],
      );
      const [start, setStart] = React.useState(startProp);
      React.useEffect(() => {
        setStart(startProp);
      }, [startProp]);

      const rendered = names.slice(start, start + WINDOW_SIZE);

      return (
        <div>
          <button>Before</button>
          <Listbox.Root
            {...rootProps}
            items={plain ? names : items}
            onItemHighlighted={(itemValue, eventDetails) => {
              onItemHighlighted?.(itemValue, eventDetails);
              const { index } = eventDetails;
              if (follow && index !== -1 && (index < start || index >= start + WINDOW_SIZE)) {
                setStart(Math.min(index, names.length - WINDOW_SIZE));
              }
            }}
          >
            <Listbox.List>
              {rendered.map((item) => (
                <Listbox.Item key={item} value={item}>
                  {item}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
          <button>After</button>
        </div>
      );
    }

    it('moves focus past the rendered items once the next item renders', async () => {
      const handleItemHighlighted = vi.fn();
      await render(<VirtualList onItemHighlighted={handleItemHighlighted} />);

      await act(async () => screen.getByRole('option', { name: 'Item 4' }).focus());
      expect(screen.queryByRole('option', { name: 'Item 5' })).toBe(null);

      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
      await flushMicrotasks();

      // Reported before item 5 renders, with its value from `items`.
      expect(handleItemHighlighted).toHaveBeenCalledWith(
        'Item 5',
        expect.objectContaining({ reason: 'keyboard', index: 5 }),
      );
      const item5 = screen.getByRole('option', { name: 'Item 5' });
      expect(item5).toHaveFocus();
      expect(item5).toHaveAttribute('data-highlighted');
    });

    it('does not press an item on Space when a press gave the list focus without an item to hold it for', async () => {
      const handleValueChange = vi.fn();
      await render(<VirtualList start={20} onValueChange={handleValueChange} />);
      const list = screen.getByRole('listbox');

      fireEvent.pointerDown(list);
      await act(async () => list.focus());
      expect(list).toHaveFocus();

      fireEvent.keyDown(list, { key: ' ' });

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    describe('while the item that receives focus is not rendered', () => {
      async function moveToUnrenderedItem(props: React.ComponentProps<typeof VirtualList> = {}) {
        const view = await render(<VirtualList follow={false} {...props} />);
        await act(async () => screen.getByRole('option', { name: 'Item 4' }).focus());
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
        await flushMicrotasks();
        return view;
      }

      it('holds focus in the list, which takes the tab stop', async () => {
        const handleItemHighlighted = vi.fn();
        await moveToUnrenderedItem({ onItemHighlighted: handleItemHighlighted });

        const list = screen.getByRole('listbox');
        expect(list).toHaveFocus();
        expect(list).toHaveAttribute('tabindex', '0');
        expect(handleItemHighlighted).toHaveBeenLastCalledWith(
          'Item 5',
          expect.objectContaining({ reason: 'keyboard', index: 5 }),
        );
      });

      it('moves focus to the item once it renders', async () => {
        const { setProps } = await moveToUnrenderedItem();
        expect(screen.getByRole('listbox')).toHaveFocus();

        await setProps({ start: 5 });

        const item5 = screen.getByRole('option', { name: 'Item 5' });
        expect(item5).toHaveFocus();
        expect(item5).toHaveAttribute('data-highlighted');
        expect(screen.getByRole('listbox')).toHaveAttribute('tabindex', '-1');
      });

      it('handles keys pressed on the list', async () => {
        const handleItemHighlighted = vi.fn();
        await moveToUnrenderedItem({ onItemHighlighted: handleItemHighlighted });

        fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });

        expect(handleItemHighlighted).toHaveBeenLastCalledWith(
          'Item 6',
          expect.objectContaining({ index: 6 }),
        );
      });

      it('removes the highlight when focus leaves the list', async () => {
        const handleItemHighlighted = vi.fn();
        const { setProps } = await moveToUnrenderedItem({
          onItemHighlighted: handleItemHighlighted,
        });
        expect(screen.getByRole('listbox')).toHaveFocus();

        const after = screen.getByRole('button', { name: 'After' });
        await act(async () => after.focus());

        expect(handleItemHighlighted).toHaveBeenLastCalledWith(
          undefined,
          expect.objectContaining({ index: -1 }),
        );

        await setProps({ start: 5 });

        expect(after).toHaveFocus();
        expect(screen.getByRole('option', { name: 'Item 5' })).not.toHaveAttribute(
          'data-highlighted',
        );
      });

      it('moves the selection in opt-in mode once the item renders', async () => {
        const handleValueChange = vi.fn();
        const { setProps } = await moveToUnrenderedItem({
          multiple: 'opt-in',
          onValueChange: handleValueChange,
        });
        expect(screen.getByRole('listbox')).toHaveFocus();
        expect(handleValueChange).not.toHaveBeenCalled();

        await setProps({ start: 5 });

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['Item 5']);
      });
    });

    it('moves the selection with focus past the rendered items in opt-in mode', async () => {
      const handleValueChange = vi.fn();
      await render(<VirtualList multiple="opt-in" onValueChange={handleValueChange} />);

      await act(async () => screen.getByRole('option', { name: 'Item 4' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Item 5' })).toHaveFocus();
      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['Item 5']);
    });

    it('extends the selection past the rendered items with Shift+ArrowDown', async () => {
      const handleValueChange = vi.fn();
      await render(<VirtualList multiple onValueChange={handleValueChange} />);

      await act(async () => screen.getByRole('option', { name: 'Item 4' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, {
        key: 'ArrowDown',
        shiftKey: true,
      });
      await flushMicrotasks();
      fireEvent.keyDown(document.activeElement as HTMLElement, {
        key: 'ArrowDown',
        shiftKey: true,
      });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Item 6' })).toHaveFocus();
      expect(handleValueChange).toHaveBeenLastCalledWith(
        ['Item 4', 'Item 5', 'Item 6'],
        expect.anything(),
      );
    });

    it('selects through the last item with Ctrl+Shift+End, including items not rendered', async () => {
      const handleValueChange = vi.fn();
      await render(<VirtualList multiple onValueChange={handleValueChange} />);

      await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, {
        key: 'End',
        ctrlKey: true,
        shiftKey: true,
      });
      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(ALL_ITEMS.slice(2));
      expect(screen.getByRole('option', { name: 'Item 99' })).toHaveFocus();
    });

    it('moves focus to the last item with End', async () => {
      await render(<VirtualList />);

      await act(async () => screen.getByRole('option', { name: 'Item 0' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Item 99' })).toHaveFocus();
    });

    it('selects every item with Ctrl+A, including those not rendered', async () => {
      const handleValueChange = vi.fn();
      await render(<VirtualList multiple onValueChange={handleValueChange} />);

      await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

      expect(handleValueChange.mock.calls[0][0]).toEqual(ALL_ITEMS);
      expect(handleValueChange.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          reason: 'list-navigation',
        }),
      );
    });

    it('moves focus to a typeahead match that is not rendered', async () => {
      await render(<VirtualList />);

      await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());
      for (const key of 'item 50') {
        fireEvent.keyDown(document.activeElement as HTMLElement, { key });
        // eslint-disable-next-line no-await-in-loop
        await flushMicrotasks();
      }

      expect(screen.getByRole('option', { name: 'Item 50' })).toHaveFocus();
    });

    it('skips disabled items that are not rendered when selecting all', async () => {
      const handleValueChange = vi.fn();
      await render(
        <VirtualList multiple disabledNames={['Item 50']} onValueChange={handleValueChange} />,
      );
      expect(screen.queryByRole('option', { name: 'Item 50' })).toBe(null);

      await act(async () => screen.getByRole('option', { name: 'Item 0' }).focus());
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });
      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(
        ALL_ITEMS.filter((item) => item !== 'Item 50'),
      );
    });

    describe('with object data', () => {
      interface Row {
        id: string;
        name: string;
      }

      const objectRows: Row[] = Array.from({ length: 20 }, (_, index) => ({
        id: `row-${index}`,
        name: `Row ${index}`,
      }));

      // Renders the first 3 rows.
      function ObjectList(
        props: Omit<Listbox.Root.Props<string, true>, 'items'> & { rows?: Row[] },
      ) {
        const { rows = objectRows, ...rootProps } = props;
        const items = React.useMemo(
          () =>
            Listbox.createItems(rows, {
              getValue: (row) => row.id,
              getLabel: (row) => row.name,
            }),
          [rows],
        );
        return (
          <Listbox.Root {...rootProps} items={items} multiple>
            <Listbox.List>
              {rows.slice(0, 3).map((row) => (
                <Listbox.Item key={row.id} value={row.id}>
                  {row.name}
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        );
      }

      it('selects the values of items that are not rendered', async () => {
        const handleValueChange = vi.fn();
        await render(<ObjectList onValueChange={handleValueChange} />);

        await act(async () => screen.getByRole('option', { name: 'Row 0' }).focus());
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });
        await flushMicrotasks();

        expect(handleValueChange.mock.calls[0][0]).toEqual(objectRows.map((row) => row.id));
      });

      it('keeps the selection on the same value after the data is replaced in another order', async () => {
        const { setProps } = await render(<ObjectList value={['row-1']} />);
        expect(
          screen.getAllByRole('option').map((option) => option.getAttribute('aria-selected')),
        ).toEqual(['false', 'true', 'false']);

        // A refetch replaces every row with a copy, and the selected row is now first.
        const [first, second, ...rest] = objectRows.map((row) => ({ ...row }));
        await setProps({ rows: [second, first, ...rest] });

        expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
          'Row 1',
          'Row 0',
          'Row 2',
        ]);
        expect(
          screen.getAllByRole('option').map((option) => option.getAttribute('aria-selected')),
        ).toEqual(['true', 'false', 'false']);
      });
    });

    describe('while the list holds focus for an item that is not rendered', () => {
      it.each([
        { name: 'Space', key: ' ' },
        { name: 'Enter', key: 'Enter' },
      ])('selects that item on $name', async ({ key }) => {
        const handleValueChange = vi.fn();
        await render(
          <Listbox.Root items={['a', 'b', 'c']} onValueChange={handleValueChange}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );

        await act(async () => screen.getByRole('option', { name: 'a' }).focus());
        fireEvent.keyDown(screen.getByRole('option', { name: 'a' }), { key: 'ArrowDown' });
        await flushMicrotasks();
        const list = screen.getByRole('listbox');
        expect(list).toHaveFocus();

        const notPrevented = fireEvent.keyDown(list, { key });

        expect(notPrevented).toBe(false);
        expect(handleValueChange.mock.lastCall?.[0]).toBe('b');
      });
    });

    describe('key presses while the list holds focus for an item that is not rendered', () => {
      const items = Listbox.createItems(['a', 'b', 'c'], {
        getValue: (item) => item,
        getLabel: (item) => item,
        isDisabled: (item) => item === 'b',
      });

      // Renders only the first item, and moves focus to the list for the item at `index`.
      async function holdFocusFor(
        index: number,
        props: Partial<Listbox.Root.Props<string, true>> & {
          onListKeyDown?: React.KeyboardEventHandler;
        } = {},
      ) {
        const { onListKeyDown, ...rootProps } = props;
        await render(
          <Listbox.Root multiple items={items} {...rootProps}>
            <Listbox.List onKeyDown={onListKeyDown}>
              <Listbox.Item value="a">a</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );
        await act(async () => screen.getByRole('option', { name: 'a' }).focus());
        for (let step = 0; step < index; step += 1) {
          fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
        }
        await flushMicrotasks();
        const list = screen.getByRole('listbox');
        expect(list).toHaveFocus();
        return list;
      }

      it('toggles the item once while Space is held', async () => {
        const handleValueChange = vi.fn();
        const list = await holdFocusFor(2, { onValueChange: handleValueChange });

        fireEvent.keyDown(list, { key: ' ' });
        fireEvent.keyDown(list, { key: ' ', repeat: true });

        expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['c']]);
      });

      it('ignores a press on a disabled item, so a range still extends from the earlier press', async () => {
        const handleValueChange = vi.fn();
        const list = await holdFocusFor(1, { onValueChange: handleValueChange });
        // The first item was not pressed, so a range from the default anchor covers a to c.
        fireEvent.keyDown(list, { key: ' ' });
        fireEvent.keyDown(list, { key: 'ArrowDown' });
        await flushMicrotasks();
        fireEvent.keyDown(list, { key: ' ', shiftKey: true });

        expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([['a', 'c']]);
      });

      it.each([
        { name: 'presses the item', prevent: false, calls: 1 },
        { name: 'does not press the item', prevent: true, calls: 0 },
      ])(
        '$name when a list handler calls preventBaseUIHandler: $prevent',
        async ({ prevent, calls }) => {
          const handleValueChange = vi.fn();
          const list = await holdFocusFor(2, {
            onValueChange: handleValueChange,
            onListKeyDown(event) {
              if (prevent && event.key === ' ') {
                (event as BaseUIEvent<React.KeyboardEvent>).preventBaseUIHandler();
              }
            },
          });

          fireEvent.keyDown(list, { key: ' ' });

          expect(handleValueChange).toHaveBeenCalledTimes(calls);
        },
      );
    });

    describe('with a collection of objects', () => {
      const fruits = Listbox.createItems(
        [
          { id: 'apple', name: 'Apple' },
          { id: 'banana', name: 'Banana', unavailable: true },
          { id: 'cherry', name: 'Cherry' },
        ],
        {
          getValue: (fruit) => fruit.id,
          getLabel: (fruit) => fruit.name,
          isDisabled: (fruit) => fruit.unavailable === true,
        },
      );

      // Renders only the first item.
      function FruitList(props: Omit<Listbox.Root.Props<string, true>, 'items'>) {
        return (
          <Listbox.Root {...props} items={fruits} multiple>
            <Listbox.List>
              <Listbox.Item value="apple">Apple</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      it('selects the values of enabled items that are not rendered', async () => {
        const handleValueChange = vi.fn();
        await render(<FruitList onValueChange={handleValueChange} />);

        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

        expect(handleValueChange.mock.calls[0][0]).toEqual(['apple', 'cherry']);
      });

      it('finds an item that is not rendered by its label', async () => {
        const handleItemHighlighted = vi.fn();
        await render(<FruitList onItemHighlighted={handleItemHighlighted} />);

        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
        handleItemHighlighted.mockClear();
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'c' });
        await flushMicrotasks();

        expect(handleItemHighlighted.mock.calls.map((call) => call[0])).toContain('cherry');
      });
    });

    describe('with a label that is not a string', () => {
      it('matches it as text and warns', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const items = Listbox.createItems(
          [
            { value: 'one', label: 'One' },
            { value: 'two', label: 2 as unknown as string },
          ],
          { getValue: (item) => item.value, getLabel: (item) => item.label },
        );

        const { user } = await render(
          <Listbox.Root items={items}>
            <Listbox.List>
              <Listbox.Item value="one">One</Listbox.Item>
              <Listbox.Item value="two">2</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );

        await act(async () => screen.getByRole('option', { name: 'One' }).focus());
        await user.keyboard('2');

        expect(screen.getByRole('option', { name: '2' })).toHaveFocus();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('which is not a string'),
        );
      });
    });

    describe('with groups', () => {
      const groups = Listbox.createItems(
        [
          { label: 'Fruits', items: ['Apple', 'Banana'] },
          { label: 'Vegetables', items: ['Carrot', 'Daikon', 'Endive'] },
        ],
        {
          getValue: (item) => item,
          getLabel: (item) => item,
          isDisabled: (item) => item === 'Daikon',
        },
      );

      // Renders only the first group.
      function GroupedList(props: Omit<Listbox.Root.Props<string, true>, 'items'>) {
        return (
          <Listbox.Root {...props} items={groups} multiple>
            <Listbox.List>
              <Listbox.Group>
                <Listbox.GroupLabel>Fruits</Listbox.GroupLabel>
                <Listbox.Item value="Apple">Apple</Listbox.Item>
                <Listbox.Item value="Banana">Banana</Listbox.Item>
              </Listbox.Group>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      it('selects the enabled items of every group', async () => {
        const handleValueChange = vi.fn();
        await render(<GroupedList onValueChange={handleValueChange} />);

        await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'a', ctrlKey: true });

        expect(handleValueChange.mock.calls[0][0]).toEqual(['Apple', 'Banana', 'Carrot', 'Endive']);
      });

      it('moves from the last item of a group to the first item of the next', async () => {
        const handleItemHighlighted = vi.fn();
        await render(<GroupedList onItemHighlighted={handleItemHighlighted} />);

        await act(async () => screen.getByRole('option', { name: 'Banana' }).focus());
        handleItemHighlighted.mockClear();
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
        await flushMicrotasks();

        expect(handleItemHighlighted.mock.calls.map((call) => call[0])).toContain('Carrot');
      });
    });

    it('puts the tab stop on the selected item that comes first in the list', async () => {
      const names = ['a', 'b', 'c', 'd'];
      await render(
        <Listbox.Root items={names} multiple defaultValue={['d', 'b']}>
          <Listbox.List>
            {names.map((name) => (
              <Listbox.Item key={name} value={name}>
                {name}
              </Listbox.Item>
            ))}
          </Listbox.List>
        </Listbox.Root>,
      );

      const tabStops = screen
        .getAllByRole('option')
        .filter((option) => option.tabIndex === 0)
        .map((option) => option.textContent);
      expect(tabStops).toEqual(['b']);
    });

    describe('when the items change', () => {
      it('moves the tab stop to the selected item when the items load', async () => {
        function LoadingList(props: { names: string[] | undefined }) {
          const items = React.useMemo(
            () =>
              Listbox.createItems(props.names, {
                getValue: (name) => name,
                getLabel: (name) => name,
              }),
            [props.names],
          );
          return (
            <Listbox.Root items={items} defaultValue="Item 2">
              <Listbox.List>
                {props.names?.slice(0, WINDOW_SIZE).map((name) => (
                  <Listbox.Item key={name} value={name}>
                    {name}
                  </Listbox.Item>
                ))}
              </Listbox.List>
            </Listbox.Root>
          );
        }

        const { setProps } = await render(<LoadingList names={undefined} />);
        await setProps({ names: ALL_ITEMS });

        expect(screen.getByRole('option', { name: 'Item 2' })).toHaveAttribute('tabindex', '0');
        expect(screen.getByRole('option', { name: 'Item 0' })).toHaveAttribute('tabindex', '-1');
      });

      it('keeps the tab stop on the focused item when items are added before it', async () => {
        const { setProps } = await render(<VirtualList />);
        const item2 = screen.getByRole('option', { name: 'Item 2' });
        await act(async () => item2.focus());

        await setProps({ names: ['New', ...ALL_ITEMS] });

        expect(item2).toHaveFocus();
        expect(item2).toHaveAttribute('tabindex', '0');
        expect(item2).toHaveAttribute('data-highlighted');
      });

      it('moves focus to the last item when the focused item is removed from the end', async () => {
        const { setProps } = await render(<VirtualList />);
        await act(async () => screen.getByRole('option', { name: 'Item 0' }).focus());
        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
        await flushMicrotasks();
        expect(screen.getByRole('option', { name: 'Item 99' })).toHaveFocus();

        await setProps({ names: ALL_ITEMS.slice(0, 50) });

        expect(screen.getByRole('option', { name: 'Item 49' })).toHaveFocus();
      });

      it('does not log an error for items added along with their data', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          const { setProps } = await render(<VirtualList names={ALL_ITEMS.slice(0, 2)} />);
          await setProps({ names: ALL_ITEMS.slice(0, 4) });

          expect(screen.getByRole('option', { name: 'Item 3' })).toBeVisible();
          expect(consoleErrorSpy).not.toHaveBeenCalled();
        } finally {
          consoleErrorSpy.mockRestore();
        }
      });
    });

    it('holds focus in the list while the focused item is not rendered', async () => {
      const { setProps } = await render(<VirtualList />);
      await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());

      // The list scrolls without moving the highlight, such as with the mouse wheel.
      await setProps({ start: 50 });
      expect(screen.getByRole('listbox')).toHaveFocus();

      await setProps({ start: 0 });
      expect(screen.getByRole('option', { name: 'Item 2' })).toHaveFocus();
    });

    describe('while the list holds focus for an item that stopped rendering', () => {
      it('returns focus to the item at its new position when items are added before it', async () => {
        const { setProps } = await render(<VirtualList />);
        await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());
        await setProps({ start: 50 });
        expect(screen.getByRole('listbox')).toHaveFocus();

        // `setProps` replaces the props it was last called with.
        const names = ['New', ...ALL_ITEMS];
        await setProps({ names, start: 50 });
        await setProps({ names, start: 0 });

        const item2 = screen.getByRole('option', { name: 'Item 2' });
        expect(item2).toHaveFocus();
        expect(item2).toHaveAttribute('tabindex', '0');
      });

      it('moves focus to the item that took its position when the item is removed', async () => {
        const { setProps } = await render(<VirtualList />);
        await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());
        await setProps({ start: 50 });
        expect(screen.getByRole('listbox')).toHaveFocus();

        await setProps({ names: ALL_ITEMS.filter((name) => name !== 'Item 2'), start: 50 });

        expect(screen.getByRole('option', { name: 'Item 3' })).toHaveFocus();
      });

      it('does not hold focus when the list is disabled', async () => {
        const { setProps } = await render(<VirtualList disabled />);
        await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());
        await setProps({ start: 50 });
        expect(document.body).toHaveFocus();

        await setProps({ disabled: false, start: 0 });
        await act(async () => screen.getByRole('listbox').focus());

        expect(screen.getByRole('option', { name: 'Item 0' })).toHaveFocus();
      });

      it.skipIf(isJSDOM)('keeps the scroll position when the item renders again', async () => {
        const ROW_HEIGHT = 20;
        const rows = Array.from({ length: 50 }, (_, index) => `Row ${index}`);

        function ScrollingList(props: { start: number }) {
          return (
            <Listbox.Root items={rows}>
              <Listbox.List style={{ height: 100, overflow: 'auto', position: 'relative' }}>
                <div style={{ height: rows.length * ROW_HEIGHT }}>
                  {rows.slice(props.start, props.start + 15).map((row, offset) => (
                    <Listbox.Item
                      key={row}
                      value={row}
                      style={{
                        position: 'absolute',
                        top: (props.start + offset) * ROW_HEIGHT,
                        height: ROW_HEIGHT,
                      }}
                    >
                      {row}
                    </Listbox.Item>
                  ))}
                </div>
              </Listbox.List>
            </Listbox.Root>
          );
        }

        const { setProps } = await render(<ScrollingList start={0} />);
        const list = screen.getByRole('listbox');
        await act(async () => screen.getByRole('option', { name: 'Row 2' }).focus());

        await setProps({ start: 20 });
        list.scrollTop = 25 * ROW_HEIGHT;
        expect(list).toHaveFocus();
        expect(list.scrollTop).toBe(25 * ROW_HEIGHT);

        // Row 2 renders again outside the visible part of the list, like overscan does.
        await setProps({ start: 2 });

        expect(screen.getByRole('option', { name: 'Row 2' })).toHaveFocus();
        expect(list.scrollTop).toBe(25 * ROW_HEIGHT);
      });
    });

    it('moves focus to a typeahead match that is not rendered when the items are an array of strings', async () => {
      await render(<VirtualList plain />);

      await act(async () => screen.getByRole('option', { name: 'Item 2' }).focus());
      for (const key of 'item 50') {
        fireEvent.keyDown(document.activeElement as HTMLElement, { key });
        // eslint-disable-next-line no-await-in-loop
        await flushMicrotasks();
      }

      expect(screen.getByRole('option', { name: 'Item 50' })).toHaveFocus();
    });

    describe('item props', () => {
      const names = ['Item 0', 'Item 1', 'Item 2'];

      it('takes the disabled state from `isDisabled`, ignoring the `disabled` prop', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const items = Listbox.createItems(names, {
          getValue: (name) => name,
          getLabel: (name) => name,
          isDisabled: (name) => name === 'Item 0',
        });

        try {
          await render(
            <Listbox.Root items={items}>
              <Listbox.List>
                <Listbox.Item value="Item 0" disabled={false}>
                  Item 0
                </Listbox.Item>
                <Listbox.Item value="Item 1" disabled>
                  Item 1
                </Listbox.Item>
              </Listbox.List>
            </Listbox.Root>,
          );

          expect(screen.getByRole('option', { name: 'Item 0' })).toHaveAttribute('data-disabled');
          expect(screen.getByRole('option', { name: 'Item 1' })).not.toHaveAttribute(
            'data-disabled',
          );
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('ignores the `disabled` and `label` props'),
          );
        } finally {
          consoleWarnSpy.mockRestore();
        }
      });

      it('takes the typeahead label from `getLabel`, ignoring the `label` prop', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          await render(
            <Listbox.Root items={names}>
              <Listbox.List>
                <Listbox.Item value="Item 0">Item 0</Listbox.Item>
                <Listbox.Item value="Item 1" label="Other">
                  Item 1
                </Listbox.Item>
              </Listbox.List>
            </Listbox.Root>,
          );

          await act(async () => screen.getByRole('option', { name: 'Item 0' }).focus());
          fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'o' });
          await flushMicrotasks();

          expect(screen.getByRole('option', { name: 'Item 0' })).toHaveFocus();
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('ignores the `disabled` and `label` props'),
          );
        } finally {
          consoleWarnSpy.mockRestore();
        }
      });

      it('does not warn when the items have neither prop', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          await render(
            <Listbox.Root items={names}>
              <Listbox.List>
                <Listbox.Item value="Item 0">Item 0</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>,
          );

          expect(consoleWarnSpy).not.toHaveBeenCalled();
        } finally {
          consoleWarnSpy.mockRestore();
        }
      });

      it('logs an error for a rendered item whose value is not in `items`', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await render(
            <Listbox.Root items={names}>
              <Listbox.List>
                <Listbox.Item value="Item 0">Item 0</Listbox.Item>
                <Listbox.Item value="Unknown">Unknown</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>,
          );

          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('has the value Unknown, which is not in the `items`'),
          );
        } finally {
          consoleErrorSpy.mockRestore();
        }
      });
    });

    it('moves focus to a selected item that is not rendered when tabbing in', async () => {
      const { user } = await render(<VirtualList defaultValue="Item 50" />);
      expect(screen.queryByRole('option', { name: 'Item 50' })).toBe(null);

      await act(async () => screen.getByRole('button', { name: 'Before' }).focus());
      await user.keyboard('{Tab}');
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Item 50' })).toHaveFocus();
    });
  });
});
