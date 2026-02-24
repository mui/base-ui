import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, it, describe } from 'vitest';
import { flushMicrotasks } from '@mui/internal-test-utils';
import { isJSDOM } from '@base-ui/utils/detectBrowser';
import { useClick, useDismiss, useFloating, useInteractions, useListNavigation } from '../index';
import type { UseListNavigationProps } from '../types';
import { Main as ComplexGrid } from '../../../test/floating-ui-tests/ComplexGrid';
import { Main as Grid } from '../../../test/floating-ui-tests/Grid';
import { Main as EmojiPicker } from '../../../test/floating-ui-tests/EmojiPicker';
import { Main as ListboxFocus } from '../../../test/floating-ui-tests/ListboxFocus';
import { Main as NestedMenu } from '../../../test/floating-ui-tests/Menu';
import { HorizontalMenu } from '../../../test/floating-ui-tests/MenuOrientation';

/* eslint-disable testing-library/no-unnecessary-act */

function App(
  inProps: Omit<Partial<UseListNavigationProps>, 'listRef'> & { disableFirstItem?: boolean } = {},
) {
  const { disableFirstItem, ...props } = inProps;
  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<Array<HTMLLIElement | null>>([]);
  const [activeIndex, setActiveIndex] = React.useState<null | number>(null);
  const { refs, context } = useFloating({
    open,
    onOpenChange: setOpen,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    useClick(context),
    useListNavigation(context, {
      ...props,
      listRef,
      activeIndex,
      onNavigate(index) {
        setActiveIndex(index);
        props.onNavigate?.(index, undefined);
      },
    }),
  ]);

  return (
    <React.Fragment>
      <button {...getReferenceProps({ ref: refs.setReference })} />
      {open && (
        <div role="menu" {...getFloatingProps({ ref: refs.setFloating })}>
          <ul>
            {['one', 'two', 'three'].map((string, index) => (
              // eslint-disable-next-line
              <li
                data-testid={`item-${index}`}
                aria-selected={activeIndex === index}
                key={string}
                tabIndex={-1}
                aria-disabled={
                  (disableFirstItem && index === 0) ||
                  (typeof props.disabledIndices === 'function'
                    ? props.disabledIndices?.(index)
                    : props.disabledIndices?.includes(index))
                }
                {...getItemProps({
                  ref(node: HTMLLIElement) {
                    listRef.current[index] = node;
                  },
                })}
              >
                {string}
              </li>
            ))}
          </ul>
        </div>
      )}
    </React.Fragment>
  );
}

describe('useListNavigation', () => {
  it('opens on ArrowDown and focuses first item', async () => {
    render(<App />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });
  });

  it('opens on ArrowUp and focuses last item', async () => {
    render(<App />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toHaveFocus();
    });
  });

  it('navigates down on ArrowDown', async () => {
    render(<App />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toHaveFocus();
    });

    // Reached the end of the list.
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toHaveFocus();
    });
  });

  it('navigates up on ArrowUp', async () => {
    render(<App />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toHaveFocus();
    });

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });

    // Reached the end of the list.
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });
  });

  it('skips disabled item on initial navigation', async () => {
    render(<App disableFirstItem loopFocus disabledIndices={[]} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toHaveFocus();
    });

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });
  });

  it('resets indexRef to -1 upon close', async () => {
    const data = ['a', 'ab', 'abc', 'abcd'];

    function Autocomplete() {
      const [open, setOpen] = React.useState(false);
      const [inputValue, setInputValue] = React.useState('');
      const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

      const listRef = React.useRef<Array<HTMLElement | null>>([]);

      const { x, y, strategy, context, refs } = useFloating({
        open,
        onOpenChange: setOpen,
      });

      const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        useDismiss(context),
        useListNavigation(context, {
          listRef,
          activeIndex,
          onNavigate: setActiveIndex,
          virtual: true,
          loopFocus: true,
        }),
      ]);

      function onChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setInputValue(value);

        if (value) {
          setActiveIndex(null);
          setOpen(true);
        } else {
          setOpen(false);
        }
      }

      const items = data.filter((item) => item.toLowerCase().startsWith(inputValue.toLowerCase()));

      return (
        <React.Fragment>
          <input
            {...getReferenceProps({
              ref: refs.setReference,
              onChange,
              value: inputValue,
              placeholder: 'Enter fruit',
              'aria-autocomplete': 'list',
            })}
            data-testid="reference"
          />
          {open && (
            <div
              {...getFloatingProps({
                ref: refs.setFloating,
                style: {
                  position: strategy,
                  left: x ?? '',
                  top: y ?? '',
                  background: '#eee',
                  color: 'black',
                  overflowY: 'auto',
                },
              })}
              data-testid="floating"
            >
              <ul>
                {items.map((item, index) => (
                  <li
                    key={item}
                    {...getItemProps({
                      ref(node) {
                        listRef.current[index] = node;
                      },
                      onClick() {
                        setInputValue(item);
                        setOpen(false);
                        (refs.domReference.current as HTMLElement | null)?.focus();
                      },
                    })}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div data-testid="active-index">{activeIndex}</div>
        </React.Fragment>
      );
    }

    render(<Autocomplete />);

    await act(async () => screen.getByTestId('reference').focus());
    await userEvent.keyboard('a');

    expect(screen.getByTestId('floating')).toBeInTheDocument();
    expect(screen.getByTestId('active-index').textContent).toBe('');

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByTestId('active-index').textContent).toBe('2');

    await userEvent.keyboard('{Escape}');

    expect(screen.getByTestId('active-index').textContent).toBe('');

    await userEvent.keyboard('{Backspace}');
    await userEvent.keyboard('a');

    expect(screen.getByTestId('floating')).toBeInTheDocument();
    expect(screen.getByTestId('active-index').textContent).toBe('');

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByTestId('active-index').textContent).toBe('0');
  });

  describe('prop: loopFocus', () => {
    it('ArrowDown looping', async () => {
      render(<App loopFocus />);

      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });

      // Reached the end of the list and loops.
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });
    });

    it('ArrowUp looping', async () => {
      render(<App loopFocus />);

      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });

      // Reached the end of the list and loops.
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });
    });
  });

  describe('prop: orientation', () => {
    it('navigates down on ArrowRight', async () => {
      render(<App orientation="horizontal" />);

      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowRight' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });

      // Reached the end of the list.
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });
    });

    it('navigates up on ArrowLeft', async () => {
      render(<App orientation="horizontal" />);

      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowLeft' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });

      // Reached the end of the list.
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });
    });
  });

  describe('prop: rtl', () => {
    it('navigates down on ArrowLeft', async () => {
      render(<App rtl orientation="horizontal" />);

      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowLeft' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });

      // Reached the end of the list.
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });
    });

    it('navigates up on ArrowRight', async () => {
      render(<App rtl orientation="horizontal" />);

      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowRight' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('item-2')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });

      // Reached the end of the list.
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });
    });
  });

  describe('prop: focusItemOnOpen', () => {
    it('focuses the first item on click when true', async () => {
      render(<App focusItemOnOpen />);
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });
    });

    it('does not focus the first item on click when false', async () => {
      render(<App focusItemOnOpen={false} />);
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).not.toHaveFocus();
      });
    });
  });

  describe('prop: selectedIndex', () => {
    it('scrolls the selected item into view on open', async ({ onTestFinished }) => {
      const requestAnimationFrame = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(() => 0);
      const scrollIntoView = vi.fn();
      const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
      HTMLElement.prototype.scrollIntoView = scrollIntoView;

      onTestFinished(() => {
        requestAnimationFrame.mockRestore();
        HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      });

      render(<App selectedIndex={0} />);
      fireEvent.click(screen.getByRole('button'));
      await flushMicrotasks();
      expect(requestAnimationFrame).toHaveBeenCalled();
      // Run the timer
      requestAnimationFrame.mock.calls.forEach((call) => call[0](0));
      expect(scrollIntoView).toHaveBeenCalled();
    });
  });

  describe('allowEscape + virtual', () => {
    it('when true', async () => {
      render(<App allowEscape virtual loopFocus />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-0').getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(screen.getByTestId('item-0').getAttribute('aria-selected')).toBe('false');
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-0').getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-1').getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-2').getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-2').getAttribute('aria-selected')).toBe('false');
      await flushMicrotasks();
    });

    it('when false', async () => {
      render(<App allowEscape={false} virtual loopFocus />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-0').getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-1').getAttribute('aria-selected')).toBe('true');
      await flushMicrotasks();
    });

    it('true - onNavigate is called with `null` when escaped', async () => {
      const spy = vi.fn();
      render(<App allowEscape virtual loopFocus onNavigate={(index) => spy(index)} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(null);
      await flushMicrotasks();
    });
  });

  describe('prop: openOnArrowKeyDown', () => {
    it('opens on ArrowDown when true', async () => {
      render(<App openOnArrowKeyDown />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await flushMicrotasks();
    });

    it('opens on ArrowUp when true', async () => {
      render(<App openOnArrowKeyDown />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await flushMicrotasks();
    });

    it('does not open on ArrowDown when false', () => {
      render(<App openOnArrowKeyDown={false} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('does not open on ArrowUp when false', () => {
      render(<App openOnArrowKeyDown={false} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('prop: disabledIndices', () => {
    it('indices are skipped in focus order', async () => {
      render(<App disabledIndices={[0]} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
      await waitFor(() => {
        expect(screen.getByTestId('item-1')).toHaveFocus();
      });
    });
  });

  describe('prop: focusItemOnHover', () => {
    it('true - focuses item on hover and syncs the active index', async () => {
      const spy = vi.fn();
      render(<App onNavigate={(index) => spy(index)} />);
      fireEvent.click(screen.getByRole('button'));
      fireEvent.mouseMove(screen.getByTestId('item-1'));
      expect(screen.getByTestId('item-1')).toHaveFocus();
      fireEvent.pointerLeave(screen.getByTestId('item-1'));
      expect(screen.getByRole('menu')).toHaveFocus();
      expect(spy).toHaveBeenCalledWith(1);
      await flushMicrotasks();
    });

    it('false - does not focus item on hover and does not sync the active index', async () => {
      const spy = vi.fn();
      render(
        <App onNavigate={(index) => spy(index)} focusItemOnOpen={false} focusItemOnHover={false} />,
      );
      fireEvent.click(screen.getByRole('button'));
      fireEvent.mouseMove(screen.getByTestId('item-1'));
      expect(screen.getByTestId('item-1')).not.toHaveFocus();
      expect(spy).toHaveBeenCalledTimes(0);
      await flushMicrotasks();
    });
  });

  describe('grid navigation', () => {
    it('ArrowDown focuses first item', async () => {
      render(<Grid />);

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      await waitFor(() => {
        expect(screen.getAllByRole('option')[8]).toHaveFocus();
      });
    });

    it('focuses first non-disabled item in grid', async () => {
      render(<Grid />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getAllByRole('option')[8]).toHaveFocus();
      });
    });

    it('focuses next item using ArrowRight key, skipping disabled items', async () => {
      render(<Grid />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[9]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[11]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[14]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[16]).toHaveFocus();
      await flushMicrotasks();
    });

    it('focuses previous item using ArrowLeft key, skipping disabled items', async () => {
      render(<Grid />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));

      act(() => screen.getAllByRole('option')[47].focus());

      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[46]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[44]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[41]).toHaveFocus();
      await flushMicrotasks();
    });

    it('skips row and remains on same column when pressing ArrowDown', async () => {
      render(<Grid />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      expect(screen.getAllByRole('option')[13]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      expect(screen.getAllByRole('option')[18]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      expect(screen.getAllByRole('option')[23]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      expect(screen.getAllByRole('option')[28]).toHaveFocus();
      await flushMicrotasks();
    });

    it('skips row and remains on same column when pressing ArrowUp', async () => {
      render(<Grid />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));

      act(() => screen.getAllByRole('option')[47].focus());

      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      expect(screen.getAllByRole('option')[42]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      expect(screen.getAllByRole('option')[37]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      expect(screen.getAllByRole('option')[32]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      expect(screen.getAllByRole('option')[27]).toHaveFocus();
      await flushMicrotasks();
    });

    it('loops on the same column with ArrowDown', async () => {
      render(<Grid loopFocus />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));

      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });

      expect(screen.getAllByRole('option')[8]).toHaveFocus();
      await flushMicrotasks();
    });

    it('loops on the same column with ArrowUp', async () => {
      render(<Grid loopFocus />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));

      act(() => screen.getAllByRole('option')[43].focus());

      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });

      expect(screen.getAllByRole('option')[43]).toHaveFocus();
      await flushMicrotasks();
    });

    it('does not leave row with "both" orientation while looping', async () => {
      render(<Grid orientation="both" loopFocus />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));

      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[9]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[8]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[9]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[8]).toHaveFocus();

      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
      expect(screen.getAllByRole('option')[13]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[14]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[11]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[14]).toHaveFocus();
      await flushMicrotasks();
    });

    it('looping works on last row', async () => {
      render(<Grid orientation="both" loopFocus />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));

      act(() => screen.getAllByRole('option')[46].focus());

      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[47]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowRight' });
      expect(screen.getAllByRole('option')[46]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[47]).toHaveFocus();
      fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowLeft' });
      expect(screen.getAllByRole('option')[46]).toHaveFocus();
      await flushMicrotasks();
    });
  });

  describe('grid navigation when items have different sizes', () => {
    it('focuses first non-disabled item in grid', async () => {
      render(<ComplexGrid />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getAllByRole('option')[7]).toHaveFocus();
      });
    });

    describe.each([
      { rtl: false, arrowToStart: 'ArrowLeft', arrowToEnd: 'ArrowRight' },
      { rtl: true, arrowToStart: 'ArrowRight', arrowToEnd: 'ArrowLeft' },
    ])('with rtl $rtl', ({ rtl, arrowToStart, arrowToEnd }) => {
      it(`focuses next item using ${arrowToEnd} key, skipping disabled items`, async () => {
        render(<ComplexGrid rtl={rtl} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[8]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[10]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[13]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[15]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[20]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[24]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[34]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[36]).toHaveFocus();
        await flushMicrotasks();
      });

      it(`focuses previous item using ${arrowToStart} key, skipping disabled items`, async () => {
        render(<ComplexGrid rtl={rtl} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));

        act(() => screen.getAllByRole('option')[36].focus());

        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        await waitFor(() => {
          expect(screen.getAllByRole('option')[34]).toHaveFocus();
        });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        await waitFor(() => {
          expect(screen.getAllByRole('option')[28]).toHaveFocus();
        });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        await waitFor(() => {
          expect(screen.getAllByRole('option')[20]).toHaveFocus();
        });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        await waitFor(() => {
          expect(screen.getAllByRole('option')[7]).toHaveFocus();
        });
      });

      it('looping works on last row', async () => {
        render(<ComplexGrid rtl={rtl} orientation="both" loopFocus />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));

        act(() => screen.getAllByRole('option')[36].focus());

        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[36]).toHaveFocus();
        await flushMicrotasks();
      });
    });
  });

  it('grid navigation with changing list items', async () => {
    render(<EmojiPicker />);

    fireEvent.click(screen.getByRole('button'));

    await flushMicrotasks();

    const input = screen.getByRole('textbox');
    const activeIndicator = screen.getByTestId('emoji-picker-active-index');
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await userEvent.keyboard('appl');
    const initialActiveIndex = activeIndicator.getAttribute('data-active-index');
    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(activeIndicator.getAttribute('data-active-index')).not.toBe(initialActiveIndex);
    });

    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(activeIndicator.getAttribute('data-active-index')).not.toBe(initialActiveIndex);
    });

    expect(activeIndicator.getAttribute('data-active-index')).not.toBeNull();
  });

  it('grid navigation with disabled list items', async () => {
    const { unmount } = render(<EmojiPicker />);

    fireEvent.click(screen.getByRole('button'));

    await flushMicrotasks();

    const input = screen.getByRole('textbox');
    const activeIndicator = screen.getByTestId('emoji-picker-active-index');
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await userEvent.keyboard('o');
    const initialActiveIndex = activeIndicator.getAttribute('data-active-index');
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByLabelText('orange')).not.toHaveAttribute('data-active');
    await waitFor(() => {
      expect(activeIndicator.getAttribute('data-active-index')).not.toBe(initialActiveIndex);
    });

    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(activeIndicator.getAttribute('data-active-index')).not.toBe(initialActiveIndex);
    });

    expect(activeIndicator.getAttribute('data-active-index')).not.toBeNull();

    unmount();

    render(<EmojiPicker />);

    fireEvent.click(screen.getByRole('button'));

    await flushMicrotasks();

    const nextInput = screen.getByRole('textbox');
    const nextActiveIndicator = screen.getByTestId('emoji-picker-active-index');
    await waitFor(() => {
      expect(nextInput).toHaveFocus();
    });

    const nextInitialActiveIndex = nextActiveIndicator.getAttribute('data-active-index');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowUp}');

    await waitFor(() => {
      expect(nextActiveIndicator.getAttribute('data-active-index')).not.toBe(
        nextInitialActiveIndex,
      );
    });
    expect(screen.getByLabelText('cherry')).toHaveAttribute('data-active');
  });

  it('selectedIndex changing does not steal focus', async () => {
    render(<ListboxFocus />);

    // TODO: This feels like a bug. It's the animation frame callback from `enqueueFocus` sometimes
    // kicking in after the click instead before, which causes flakeyness in this test as the wrong
    // element will be focused.
    await waitFor(() => {
      expect(document.activeElement).toHaveRole('option');
    });

    await userEvent.click(screen.getByTestId('reference'));

    await waitFor(() => {
      expect(screen.getByTestId('reference')).toHaveFocus();
    });
  });

  // In JSDOM it will not focus the first item, but will in the browser
  it.skipIf(!isJSDOM)('focus management in nested lists', async () => {
    render(<NestedMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByText('Text')).toHaveFocus();
  });

  // In JSDOM it will not focus the first item, but will in the browser
  it.skipIf(!isJSDOM)('keyboard navigation in nested menus lists', async () => {
    render(<NestedMenu />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await flushMicrotasks();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowRight}'); // opens first submenu
    await flushMicrotasks();

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowRight}'); // opens second submenu
    await flushMicrotasks();

    expect(screen.getByText('.png')).toHaveFocus();

    // it navigation with orientation = 'both'
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('.jpg')).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByText('.gif')).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByText('.svg')).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByText('.png')).toHaveFocus();

    // escape closes the submenu
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText('Image')).toHaveFocus();
  });

  // In JSDOM it will not focus the first item, but will in the browser
  it.skipIf(!isJSDOM)(
    'keyboard navigation in nested menus with different orientation',
    async () => {
      render(<HorizontalMenu />);

      await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
      await act(async () => {});
      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{ArrowDown}'); // opens the Copy as submenu
      await act(async () => {});

      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{ArrowDown}'); // opens the Share submenu
      await act(async () => {});

      expect(screen.getByText('Mail')).toHaveFocus();

      await userEvent.keyboard('{ArrowLeft}');
      expect(screen.getByText('Copy as')).toHaveFocus();
    },
  );

  it('Home or End key press is ignored for typeable combobox reference', async () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    function App() {
      const [open, setOpen] = React.useState(false);
      const listRef = React.useRef<Array<HTMLLIElement | null>>([]);
      const [activeIndex, setActiveIndex] = React.useState<null | number>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange: setOpen,
      });
      const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        useClick(context),
        useListNavigation(context, {
          listRef,
          activeIndex,
          onNavigate: setActiveIndex,
        }),
      ]);

      return (
        /* eslint-disable jsx-a11y/role-has-required-aria-props */
        <React.Fragment>
          <input role="combobox" ref={refs.setReference} {...getReferenceProps()} />
          {open && (
            <div role="menu" {...getFloatingProps({ ref: refs.setFloating })}>
              <ul>
                {['one', 'two', 'three'].map((string, index) => (
                  // eslint-disable-next-line jsx-a11y/role-supports-aria-props
                  <li
                    data-testid={`item-${index}`}
                    aria-selected={activeIndex === index}
                    key={string}
                    tabIndex={-1}
                    {...getItemProps({
                      ref(node: HTMLLIElement) {
                        listRef.current[index] = node;
                      },
                    })}
                  >
                    {string}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </React.Fragment>
      );
    }

    render(<App />);

    await act(async () => {
      screen.getByRole('combobox').focus();
    });

    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });

    await userEvent.keyboard('{End}');

    expect(screen.getByTestId('item-0')).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Home}');

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });
  });
});
