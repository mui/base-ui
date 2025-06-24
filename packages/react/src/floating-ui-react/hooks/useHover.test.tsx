/* eslint-disable @typescript-eslint/no-shadow */
import {
  act,
  cleanup,
  fireEvent,
  flushMicrotasks,
  render,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import * as React from 'react';
import { vi, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useFloating, useHover, useInteractions } from '../index';
import type { UseHoverProps } from './useHover';
import { Popover } from '../../../test/floating-ui-tests/Popover';
import { isJSDOM } from '../../utils/detectBrowser';

vi.useFakeTimers();

function App({ showReference = true, ...props }: UseHoverProps & { showReference?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const { refs, context } = useFloating({
    open,
    onOpenChange: setOpen,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([useHover(context, props)]);

  return (
    <React.Fragment>
      {showReference && <button {...getReferenceProps({ ref: refs.setReference })} />}
      {open && <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />}
    </React.Fragment>
  );
}

describe.skipIf(!isJSDOM)('useHover', () => {
  test('opens on mouseenter', () => {
    render(<App />);

    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    cleanup();
  });

  test('closes on mouseleave', () => {
    render(<App />);

    fireEvent.mouseEnter(screen.getByRole('button'));
    fireEvent.mouseLeave(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    cleanup();
  });

  describe('delay', () => {
    test('symmetric number', async () => {
      render(<App delay={1000} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(999);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      cleanup();
    });

    test('open', async () => {
      render(<App delay={{ open: 500 }} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(499);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      cleanup();
    });

    test('close', async () => {
      render(<App delay={{ close: 500 }} />);

      fireEvent.mouseEnter(screen.getByRole('button'));
      fireEvent.mouseLeave(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(499);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      cleanup();
    });

    test('open with close 0', async () => {
      render(<App delay={{ open: 500 }} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(499);
      });

      fireEvent.mouseLeave(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(1);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      cleanup();
    });

    test('restMs + nullish open delay should respect restMs', async () => {
      render(<App restMs={100} delay={{ close: 100 }} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(99);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      cleanup();
    });
  });

  test('restMs', async () => {
    render(<App restMs={100} />);

    const button = screen.getByRole('button');

    const originalDispatchEvent = button.dispatchEvent;
    const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
      Object.defineProperty(event, 'movementX', { value: 10 });
      Object.defineProperty(event, 'movementY', { value: 10 });
      return originalDispatchEvent.call(button, event);
    });

    fireEvent.mouseMove(button);

    await act(async () => {
      vi.advanceTimersByTime(99);
    });

    fireEvent.mouseMove(button);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseMove(button);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    spy.mockRestore();
    cleanup();
  });

  test.skip('restMs is always 0 for touch input', async () => {
    render(<App restMs={100} />);

    fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' });
    fireEvent.mouseMove(screen.getByRole('button'));

    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  test('restMs does not cause floating element to open if mouseOnly is true', async () => {
    render(<App restMs={100} mouseOnly />);

    fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' });
    fireEvent.mouseMove(screen.getByRole('button'));

    await flushMicrotasks();

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('restMs does not reset timer for minor mouse movement', async () => {
    render(<App restMs={100} />);

    const button = screen.getByRole('button');

    const originalDispatchEvent = button.dispatchEvent;
    const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
      Object.defineProperty(event, 'movementX', { value: 1 });
      Object.defineProperty(event, 'movementY', { value: 0 });
      return originalDispatchEvent.call(button, event);
    });

    fireEvent.mouseMove(button);

    await act(async () => {
      vi.advanceTimersByTime(99);
    });

    fireEvent.mouseMove(button);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    spy.mockRestore();
    cleanup();
  });

  test('mouseleave on the floating element closes it (mouse)', async () => {
    render(<App />);

    fireEvent.mouseEnter(screen.getByRole('button'));
    await flushMicrotasks();

    fireEvent(
      screen.getByRole('button'),
      new MouseEvent('mouseleave', {
        relatedTarget: screen.getByRole('tooltip'),
      }),
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('does not show after delay if domReference changes', async () => {
    const { rerender } = render(<App delay={1000} />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    rerender(<App showReference={false} />);

    await act(async () => {
      vi.advanceTimersByTime(999);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    cleanup();
  });

  test('reason string', async () => {
    function App() {
      const [isOpen, setIsOpen] = React.useState(false);
      const { refs, context } = useFloating({
        open: isOpen,
        onOpenChange(isOpen, _, reason) {
          setIsOpen(isOpen);
          expect(reason).toBe('hover');
        },
      });

      const hover = useHover(context);
      const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

      return (
        <React.Fragment>
          <button ref={refs.setReference} {...getReferenceProps()} />
          {isOpen && <div role="tooltip" ref={refs.setFloating} {...getFloatingProps()} />}
        </React.Fragment>
      );
    }

    render(<App />);
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    await flushMicrotasks();
    fireEvent.mouseLeave(button);
  });

  test('cleans up blockPointerEvents if trigger changes', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(
      <Popover
        hover={false}
        modal={false}
        bubbles
        render={({ labelId, descriptionId, close }) => (
          <React.Fragment>
            <h2 id={labelId} className="mb-2 text-2xl font-bold">
              Parent title
            </h2>
            <p id={descriptionId} className="mb-2">
              Description
            </p>
            <Popover
              hover
              modal={false}
              bubbles
              render={({ labelId, descriptionId, close }) => (
                <React.Fragment>
                  <h2 id={labelId} className="mb-2 text-2xl font-bold">
                    Child title
                  </h2>
                  <p id={descriptionId} className="mb-2">
                    Description
                  </p>
                  <button onClick={close} className="font-bold">
                    Close
                  </button>
                </React.Fragment>
              )}
            >
              <button type="button">Open child</button>
            </Popover>
            <button onClick={close} className="font-bold">
              Close
            </button>
          </React.Fragment>
        )}
      >
        <button type="button">Open parent</button>
      </Popover>,
    );

    await user.click(screen.getByText('Open parent'));
    expect(screen.getByText('Parent title')).toBeInTheDocument();
    await user.click(screen.getByText('Open child'));
    expect(screen.getByText('Child title')).toBeInTheDocument();
    await user.click(screen.getByText('Child title'));
    // clean up blockPointerEvents
    // userEvent.unhover does not work because of the pointer-events
    fireEvent.mouseLeave(screen.getByRole('dialog', { name: 'Child title' }));
    expect(screen.getByText('Child title')).toBeInTheDocument();
    await user.click(screen.getByText('Parent title'));
    // screen.debug();
    expect(screen.getByText('Parent title')).toBeInTheDocument();

    vi.useFakeTimers();
  });
});
