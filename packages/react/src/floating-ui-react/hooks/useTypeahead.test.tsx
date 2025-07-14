import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { useClick, useFloating, useInteractions, useTypeahead } from '../index';
import type { UseTypeaheadProps } from './useTypeahead';
import { Main } from '../../../test/floating-ui-tests/Menu';

vi.useFakeTimers({ shouldAdvanceTime: true });

const useImpl = ({
  addUseClick = false,
  ...props
}: Pick<UseTypeaheadProps, 'onMatch' | 'onTypingChange'> & {
  list?: Array<string>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  addUseClick?: boolean;
}) => {
  const [open, setOpen] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<null | number>(null);
  const { refs, context } = useFloating({
    open: props.open ?? open,
    onOpenChange: props.onOpenChange ?? setOpen,
  });
  const listRef = React.useRef(props.list ?? ['one', 'two', 'three']);
  const typeahead = useTypeahead(context, {
    listRef,
    activeIndex,
    onMatch(index) {
      setActiveIndex(index);
      props.onMatch?.(index);
    },
    onTypingChange: props.onTypingChange,
  });
  const click = useClick(context, {
    enabled: addUseClick,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([typeahead, click]);

  return {
    activeIndex,
    open,
    getReferenceProps: (userProps?: React.HTMLProps<Element>) =>
      getReferenceProps({
        role: 'combobox',
        ...userProps,
        ref: refs.setReference,
      }),
    getFloatingProps: () =>
      getFloatingProps({
        role: 'listbox',
        ref: refs.setFloating,
      }),
  };
};

function Combobox(
  props: Pick<UseTypeaheadProps, 'onMatch' | 'onTypingChange'> & {
    list?: Array<string>;
  },
) {
  const { getReferenceProps, getFloatingProps } = useImpl(props);
  return (
    <React.Fragment>
      <input {...getReferenceProps()} />
      <div {...getFloatingProps()} />
    </React.Fragment>
  );
}

describe('useTypeahead', () => {
  it('rapidly focuses list items when they start with the same letter', async () => {
    const spy = vi.fn();
    render(<Combobox onMatch={spy} />);

    await userEvent.click(screen.getByRole('combobox'));

    await userEvent.keyboard('t');
    expect(spy).toHaveBeenCalledWith(1);

    await userEvent.keyboard('t');
    expect(spy).toHaveBeenCalledWith(2);

    await userEvent.keyboard('t');
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('bails out of rapid focus of first letter if the list contains a string that starts with two of the same letter', async () => {
    const spy = vi.fn();
    render(<Combobox onMatch={spy} list={['apple', 'aaron', 'apricot']} />);

    await userEvent.click(screen.getByRole('combobox'));

    await userEvent.keyboard('a');
    expect(spy).toHaveBeenCalledWith(0);

    await userEvent.keyboard('a');
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('starts from the current activeIndex and correctly loops', async () => {
    const spy = vi.fn();
    render(<Combobox onMatch={spy} list={['Toy Story 2', 'Toy Story 3', 'Toy Story 4']} />);

    await userEvent.click(screen.getByRole('combobox'));

    await userEvent.keyboard('t');
    await userEvent.keyboard('o');
    await userEvent.keyboard('y');
    expect(spy).toHaveBeenCalledWith(0);

    spy.mockReset();

    await userEvent.keyboard('t');
    await userEvent.keyboard('o');
    await userEvent.keyboard('y');
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(750);

    await userEvent.keyboard('t');
    await userEvent.keyboard('o');
    await userEvent.keyboard('y');
    expect(spy).toHaveBeenCalledWith(1);

    vi.advanceTimersByTime(750);

    await userEvent.keyboard('t');
    await userEvent.keyboard('o');
    await userEvent.keyboard('y');
    expect(spy).toHaveBeenCalledWith(2);

    vi.advanceTimersByTime(750);

    await userEvent.keyboard('t');
    await userEvent.keyboard('o');
    await userEvent.keyboard('y');
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('capslock characters continue to match', async () => {
    const spy = vi.fn();
    render(<Combobox onMatch={spy} />);

    await userEvent.click(screen.getByRole('combobox'));

    await userEvent.keyboard('{CapsLock}t');
    expect(spy).toHaveBeenCalledWith(1);
  });

  function App1(props: Pick<UseTypeaheadProps, 'onMatch'> & { list: Array<string> }) {
    const { getReferenceProps, getFloatingProps, activeIndex, open } = useImpl(props);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    return (
      <React.Fragment>
        <div
          {...getReferenceProps({
            onClick: () => inputRef.current?.focus(),
          })}
        >
          <input ref={inputRef} readOnly />
        </div>
        {open && (
          <div {...getFloatingProps()}>
            {props.list.map((value, i) => (
              <div
                key={value}
                role="option"
                tabIndex={i === activeIndex ? 0 : -1}
                aria-selected={i === activeIndex}
              >
                {value}
              </div>
            ))}
          </div>
        )}
      </React.Fragment>
    );
  }

  it('matches when focus is within reference', async () => {
    const spy = vi.fn();
    render(<App1 onMatch={spy} list={['one', 'two', 'three']} />);

    await userEvent.click(screen.getByRole('combobox'));

    await userEvent.keyboard('t');
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('matches when focus is within floating', async () => {
    const spy = vi.fn();
    render(<App1 onMatch={spy} list={['one', 'two', 'three']} />);

    await userEvent.click(screen.getByRole('combobox'));

    await userEvent.keyboard('t');
    const option = await screen.findByRole('option', { selected: true });
    expect(option.textContent).toBe('two');
    option.focus();
    expect(option).toHaveFocus();

    await userEvent.keyboard('h');
    expect((await screen.findByRole('option', { selected: true })).textContent).toBe('three');
  });

  it('onTypingChange is called when typing starts or stops', async () => {
    const spy = vi.fn();
    render(<Combobox onTypingChange={spy} list={['one', 'two', 'three']} />);

    act(() => screen.getByRole('combobox').focus());

    await userEvent.keyboard('t');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(true);

    vi.advanceTimersByTime(750);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('Menu - skips disabled items and opens submenu on space if no match', async () => {
    vi.useRealTimers();

    render(<Main />);

    await userEvent.click(screen.getByText('Edit'));

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await userEvent.keyboard('c');

    expect(screen.getByText('Copy as')).toHaveFocus();

    await userEvent.keyboard('opy as ');

    expect(screen.getByText('Copy as').getAttribute('aria-expanded')).toBe('false');

    await userEvent.keyboard(' ');

    expect(screen.getByText('Copy as').getAttribute('aria-expanded')).toBe('true');
  });
});
