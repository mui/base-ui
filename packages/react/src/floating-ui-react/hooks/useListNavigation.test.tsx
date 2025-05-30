import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, it, describe } from 'vitest';

import { useClick, useDismiss, useFloating, useInteractions, useListNavigation } from '../index';
import type { UseListNavigationProps } from '../types';
import { Main as ComplexGrid } from '../test-components/ComplexGrid';
import { Main as Grid } from '../test-components/Grid';
import { Main as EmojiPicker } from '../test-components/EmojiPicker';
import { Main as ListboxFocus } from '../test-components/ListboxFocus';
import { Main as NestedMenu } from '../test-components/Menu';
import { HorizontalMenu } from '../test-components/MenuOrientation';
import { Menu, MenuItem } from '../test-components/MenuVirtual';
import { isJSDOM } from '../../utils/detectBrowser';

/* eslint-disable testing-library/no-unnecessary-act */

function App(props: Omit<Partial<UseListNavigationProps>, 'listRef'>) {
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
        props.onNavigate?.(index);
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

  it('resets indexRef to -1 upon close', async () => {
    const data = ['a', 'ab', 'abc', 'abcd'];

    function Autocomplete() {
      const [open, setOpen] = React.useState(false);
      const [inputValue, setInputValue] = React.useState('');
      const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

      const listRef = React.useRef<Array<HTMLElement | null>>([]);

      const { x, y, strategy, context, refs } = useFloating<HTMLInputElement>({
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
          loop: true,
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
                        refs.domReference.current?.focus();
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

    act(() => screen.getByTestId('reference').focus());
    await userEvent.keyboard('a');
    await act(async () => {});

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

  describe('loop', () => {
    it('ArrowDown looping', async () => {
      render(<App loop />);

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
      render(<App loop />);

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

  describe('orientation', () => {
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

  describe('rtl', () => {
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

  describe('focusItemOnOpen', () => {
    it('true click', async () => {
      render(<App focusItemOnOpen />);
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).toHaveFocus();
      });
    });

    it('false click', async () => {
      render(<App focusItemOnOpen={false} />);
      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByTestId('item-0')).not.toHaveFocus();
      });
    });
  });

  describe('selectedIndex', () => {
    it('scrollIntoView on open', ({ onTestFinished }) => {
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
      expect(requestAnimationFrame).toHaveBeenCalled();
      // Run the timer
      requestAnimationFrame.mock.calls.forEach((call) => call[0](0));
      expect(scrollIntoView).toHaveBeenCalled();
    });
  });

  describe('allowEscape + virtual', () => {
    it('true', () => {
      render(<App allowEscape virtual loop />);
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
    });

    it('false', () => {
      render(<App allowEscape={false} virtual loop />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-0').getAttribute('aria-selected')).toBe('true');
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByTestId('item-1').getAttribute('aria-selected')).toBe('true');
    });

    it('true - onNavigate is called with `null` when escaped', () => {
      const spy = vi.fn();
      render(<App allowEscape virtual loop onNavigate={spy} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(null);
    });
  });

  describe('openOnArrowKeyDown', () => {
    it('true ArrowDown', () => {
      render(<App openOnArrowKeyDown />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('true ArrowUp', () => {
      render(<App openOnArrowKeyDown />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('false ArrowDown', () => {
      render(<App openOnArrowKeyDown={false} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('false ArrowUp', () => {
      render(<App openOnArrowKeyDown={false} />);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('disabledIndices', () => {
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

  describe('focusOnHover', () => {
    it('true - focuses item on hover and syncs the active index', () => {
      const spy = vi.fn();
      render(<App onNavigate={spy} />);
      fireEvent.click(screen.getByRole('button'));
      fireEvent.mouseMove(screen.getByTestId('item-1'));
      expect(screen.getByTestId('item-1')).toHaveFocus();
      fireEvent.pointerLeave(screen.getByTestId('item-1'));
      expect(screen.getByRole('menu')).toHaveFocus();
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('false - does not focus item on hover and does not sync the active index', async () => {
      const spy = vi.fn();
      render(<App onNavigate={spy} focusItemOnOpen={false} focusItemOnHover={false} />);
      fireEvent.click(screen.getByRole('button'));
      fireEvent.mouseMove(screen.getByTestId('item-1'));
      expect(screen.getByTestId('item-1')).not.toHaveFocus();
      expect(spy).toHaveBeenCalledTimes(0);
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

    it('focuses next item using ArrowRight key, skipping disabled items', () => {
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
    });

    it('focuses previous item using ArrowLeft key, skipping disabled items', () => {
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
    });

    it('skips row and remains on same column when pressing ArrowDown', () => {
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
    });

    it('skips row and remains on same column when pressing ArrowUp', () => {
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
    });

    it('loops on the same column with ArrowDown', () => {
      render(<Grid loop />);
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
    });

    it('loops on the same column with ArrowUp', () => {
      render(<Grid loop />);
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
    });

    it('does not leave row with "both" orientation while looping', () => {
      render(<Grid orientation="both" loop />);
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
    });

    it('looping works on last row', () => {
      render(<Grid orientation="both" loop />);
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
      it(`focuses next item using ${arrowToEnd} key, skipping disabled items`, () => {
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

      it(`moves through rows when pressing ArrowDown, prefers ${
        rtl ? 'right' : 'left'
      } side of wide items`, () => {
        render(<ComplexGrid rtl={rtl} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        expect(screen.getAllByRole('option')[20]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        expect(screen.getAllByRole('option')[25]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        expect(screen.getAllByRole('option')[31]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        expect(screen.getAllByRole('option')[36]).toHaveFocus();
      });

      it(`moves through rows when pressing ArrowUp, prefers ${
        rtl ? 'right' : 'left'
      } side of wide items`, () => {
        render(<ComplexGrid rtl={rtl} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));

        act(() => screen.getAllByRole('option')[29].focus());

        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        expect(screen.getAllByRole('option')[21]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        expect(screen.getAllByRole('option')[15]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        expect(screen.getAllByRole('option')[8]).toHaveFocus();
      });

      it(`loops over column with ArrowDown, prefers ${
        rtl ? 'right' : 'left'
      } side of wide items`, () => {
        render(<ComplexGrid rtl={rtl} loop />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));

        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });

        expect(screen.getAllByRole('option')[13]).toHaveFocus();
      });

      it(`loops over column with ArrowUp, prefers ${
        rtl ? 'right' : 'left'
      } side of wide items`, () => {
        render(<ComplexGrid rtl={rtl} loop />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));

        act(() => screen.getAllByRole('option')[30].focus());

        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowUp' });

        expect(screen.getAllByRole('option')[8]).toHaveFocus();
      });

      it('loops over row with "both" orientation, prefers top side of tall items', () => {
        render(<ComplexGrid rtl={rtl} orientation="both" loop />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));

        act(() => screen.getAllByRole('option')[20].focus());

        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[21]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[20]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        expect(screen.getAllByRole('option')[21]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToStart });
        expect(screen.getAllByRole('option')[21]).toHaveFocus();

        fireEvent.keyDown(screen.getByTestId('floating'), { key: 'ArrowDown' });
        expect(screen.getAllByRole('option')[22]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[24]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[20]).toHaveFocus();
        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[21]).toHaveFocus();
      });

      it('looping works on last row', () => {
        render(<ComplexGrid rtl={rtl} orientation="both" loop />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button'));

        act(() => screen.getAllByRole('option')[36].focus());

        fireEvent.keyDown(screen.getByTestId('floating'), { key: arrowToEnd });
        expect(screen.getAllByRole('option')[36]).toHaveFocus();
      });
    });
  });

  it('grid navigation with changing list items', async () => {
    render(<EmojiPicker />);

    fireEvent.click(screen.getByRole('button'));

    await act(async () => {});

    expect(screen.getByRole('textbox')).toHaveFocus();

    await userEvent.keyboard('appl');
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByLabelText('apple')).toHaveAttribute('data-active');

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByLabelText('apple')).toHaveAttribute('data-active');
  });

  it('grid navigation with disabled list items', async () => {
    const { unmount } = render(<EmojiPicker />);

    fireEvent.click(screen.getByRole('button'));

    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    await userEvent.keyboard('o');
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByLabelText('orange')).not.toHaveAttribute('data-active');
    expect(screen.getByLabelText('watermelon')).toHaveAttribute('data-active');

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByLabelText('watermelon')).toHaveAttribute('data-active');

    unmount();

    render(<EmojiPicker />);

    fireEvent.click(screen.getByRole('button'));

    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByLabelText('cherry')).toHaveAttribute('data-active');
  });

  it('selectedIndex changing does not steal focus', async () => {
    render(<ListboxFocus />);

    await userEvent.click(screen.getByTestId('reference'));
    await act(async () => {});

    expect(screen.getByTestId('reference')).toHaveFocus();
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
    await act(async () => {});
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowRight}'); // opens first submenu
    await act(async () => {});

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowRight}'); // opens second submenu
    await act(async () => {});

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

  it('virtual nested Home or End key press', async () => {
    const ref = { current: null } as any;
    render(
      <Menu label="Edit" virtualItemRef={ref}>
        <MenuItem label="Undo" />
        <MenuItem label="Redo" />
        <Menu label="Copy as" virtualItemRef={ref}>
          <MenuItem label="Text" />
          <MenuItem label="Video" />
          <Menu label="Image" virtualItemRef={ref}>
            <MenuItem label=".png" />
            <MenuItem label=".jpg" />
            <MenuItem label=".svg" />
            <MenuItem label=".gif" />
          </Menu>
          <MenuItem label="Audio" />
        </Menu>
        <Menu label="Share" virtualItemRef={ref}>
          <MenuItem label="Mail" />
          <MenuItem label="Instagram" />
        </Menu>
      </Menu>,
    );

    act(() => {
      screen.getByRole('combobox').focus();
    });

    await userEvent.keyboard('{ArrowDown}'); // open menu
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}'); // focus Copy as menu
    await userEvent.keyboard('{ArrowRight}'); // open Copy as submenu
    await act(async () => {});
    await userEvent.keyboard('{End}');

    expect(screen.getByText('Audio')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Share')).not.toHaveAttribute('aria-selected', 'true');
  });

  it('domReference trigger in nested virtual menu is set as virtual item', async () => {
    const ref = { current: null } as any;
    // eslint-disable-next-line @typescript-eslint/no-shadow
    function App() {
      return (
        <Menu label="Edit" virtualItemRef={ref}>
          <MenuItem label="Undo" />
          <MenuItem label="Redo" />
          <Menu label="Copy as" data-testid="copy" virtualItemRef={ref}>
            <MenuItem label="Text" />
            <MenuItem label="Video" />
            <Menu label="Image" virtualItemRef={ref}>
              <MenuItem label=".png" />
              <MenuItem label=".jpg" />
              <MenuItem label=".svg" />
              <MenuItem label=".gif" />
            </Menu>
            <MenuItem label="Audio" />
          </Menu>
          <Menu label="Share" virtualItemRef={ref}>
            <MenuItem label="Mail" />
            <MenuItem label="Instagram" />
          </Menu>
        </Menu>
      );
    }

    render(<App />);

    act(() => {
      screen.getByRole('combobox').focus();
    });

    await userEvent.keyboard('{ArrowDown}'); // open menu
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}'); // focus Copy as menu
    await userEvent.keyboard('{ArrowRight}'); // open Copy as submenu
    await act(async () => {});

    expect(screen.getByText('Text')).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowLeft}'); // close Copy as submenu

    expect(ref.current).toBe(screen.getByTestId('copy'));
  });

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

    act(() => {
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
