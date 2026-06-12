import { vi, expect } from 'vitest';
import { act, fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { isJSDOM } from '#test-utils';
import { useFloating } from './useFloating';
import {
  useHoverReferenceInteraction,
  type UseHoverReferenceInteractionProps,
} from './useHoverReferenceInteraction';
import { useHoverFloatingInteraction } from './useHoverFloatingInteraction';
import { REASONS } from '../../internals/reasons';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';

describe.skipIf(!isJSDOM)('useHoverReferenceInteraction', () => {
  it('does not treat child target as inactive when handlers are on a wrapper', async () => {
    const onOpenChange = vi.fn();

    function App() {
      const [open, setOpen] = React.useState(true);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange(nextOpen, details) {
          onOpenChange(nextOpen, details);
          setOpen(nextOpen);
        },
      });

      const hoverProps = useHoverReferenceInteraction(context, {
        mouseOnly: true,
        restMs: 100,
        delay: { close: 0 },
        move: false,
        triggerElementRef,
      });

      return (
        <React.Fragment>
          <div data-testid="wrapper" {...hoverProps}>
            <button
              data-testid="trigger"
              ref={(node) => {
                refs.setReference(node);
                triggerElementRef.current = node;
              }}
            />
          </div>
          {open && <div role="tooltip" ref={refs.setFloating} />}
        </React.Fragment>
      );
    }

    render(<App />);

    const wrapper = screen.getByTestId('wrapper');
    const trigger = screen.getByTestId('trigger');

    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseMove(trigger, { movementX: 10, movementY: 0 });

    await flushMicrotasks();

    // Moving over the active trigger should not emit a redundant openchange.
    expect(onOpenChange).toHaveBeenCalledTimes(0);
    expect(screen.queryByRole('tooltip')).not.toBe(null);
  });

  it('does not treat a synthetic child target as inactive when the native path differs', async () => {
    const onOpenChange = vi.fn();

    function App() {
      const [open, setOpen] = React.useState(true);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange(nextOpen, details) {
          onOpenChange(nextOpen, details);
          setOpen(nextOpen);
        },
      });

      const hoverProps = useHoverReferenceInteraction(context, {
        mouseOnly: true,
        restMs: 100,
        delay: { close: 0 },
        move: false,
        triggerElementRef,
      });

      return (
        <React.Fragment>
          <div data-testid="wrapper" {...hoverProps}>
            <button
              data-testid="trigger"
              ref={(node) => {
                refs.setReference(node);
                triggerElementRef.current = node;
              }}
            >
              <span data-testid="child" />
            </button>
          </div>
          {open && <div role="tooltip" ref={refs.setFloating} />}
        </React.Fragment>
      );
    }

    render(<App />);

    const wrapper = screen.getByTestId('wrapper');
    const child = screen.getByTestId('child');

    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    fireEvent.mouseEnter(wrapper);

    const event = new MouseEvent('mousemove', { bubbles: true });
    Object.defineProperties(event, {
      composedPath: {
        configurable: true,
        value: () => [document.body, child, wrapper],
      },
      movementX: {
        configurable: true,
        value: 10,
      },
      movementY: {
        configurable: true,
        value: 0,
      },
    });

    fireEvent(child, event);

    await flushMicrotasks();

    expect(onOpenChange).toHaveBeenCalledTimes(0);
    expect(screen.queryByRole('tooltip')).not.toBe(null);
  });

  it('treats disabled child trigger as inactive in wrapper fallback mode', async () => {
    const onOpenChange = vi.fn();

    function App() {
      const [open, setOpen] = React.useState(true);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange(nextOpen, details) {
          onOpenChange(nextOpen, details);
          setOpen(nextOpen);
        },
      });

      const hoverProps = useHoverReferenceInteraction(context, {
        mouseOnly: true,
        restMs: 100,
        delay: { close: 0 },
        move: false,
        triggerElementRef,
      });

      return (
        <React.Fragment>
          <button
            data-testid="active-trigger"
            ref={(node) => {
              refs.setReference(node);
              triggerElementRef.current = node;
            }}
          />
          <div data-testid="inactive-wrapper" {...hoverProps}>
            <button
              data-testid="disabled-trigger"
              data-trigger-disabled
              ref={(node) => {
                if (node) {
                  context.rootStore.context.triggerElements.add('disabled-trigger', node);
                }
              }}
            />
          </div>
          {open && <div role="tooltip" ref={refs.setFloating} />}
        </React.Fragment>
      );
    }

    render(<App />);

    const activeTrigger = screen.getByTestId('active-trigger');
    const wrapper = screen.getByTestId('inactive-wrapper');
    const disabledTrigger = screen.getByTestId('disabled-trigger');

    fireEvent.pointerEnter(activeTrigger, { pointerType: 'mouse' });
    fireEvent.mouseEnter(activeTrigger);
    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    fireEvent.mouseMove(disabledTrigger, { movementX: 10, movementY: 0 });

    await flushMicrotasks();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('tooltip')).not.toBe(null);
  });

  it('reopens immediately for same trigger in delegated wrapper mode during close transition', async () => {
    const onOpenChange = vi.fn();
    let closeFromHover: (() => void) | null = null;

    function App() {
      const [open, setOpen] = React.useState(true);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange(nextOpen, details) {
          onOpenChange(nextOpen, details);
          setOpen(nextOpen);
        },
      });

      closeFromHover = () => {
        context.rootStore.setOpen(
          false,
          createChangeEventDetails(REASONS.triggerHover, new MouseEvent('mouseleave')),
        );
      };

      // Simulate active close transition lifecycle while closed.
      (context.rootStore.state as { transitionStatus?: 'ending' | undefined }).transitionStatus =
        open ? undefined : 'ending';

      const hoverProps = useHoverReferenceInteraction(context, {
        mouseOnly: true,
        move: false,
        delay: { open: 500, close: 0 },
        triggerElementRef,
      });

      return (
        <React.Fragment>
          <div
            data-testid="wrapper"
            {...hoverProps}
            ref={(node) => {
              triggerElementRef.current = node;
            }}
          >
            <button
              data-testid="trigger"
              ref={(node) => {
                refs.setReference(node);
              }}
            />
          </div>
          {open && <div role="tooltip" ref={refs.setFloating} />}
        </React.Fragment>
      );
    }

    render(<App />);

    const wrapper = screen.getByTestId('wrapper');
    await flushMicrotasks();

    await act(async () => {
      closeFromHover?.();
    });

    await flushMicrotasks();
    expect(screen.queryByRole('tooltip')).toBe(null);

    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    fireEvent.mouseEnter(wrapper);

    await flushMicrotasks();

    // Close from hover + immediate reopen without waiting open delay.
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange.mock.calls[1][0]).toBe(true);
    expect(screen.queryByRole('tooltip')).not.toBe(null);
  });

  it('reopens immediately when close transition state is provided externally', async () => {
    const onOpenChange = vi.fn();
    let closeFromHover: (() => void) | null = null;

    function App() {
      const [open, setOpen] = React.useState(true);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange(nextOpen, details) {
          onOpenChange(nextOpen, details);
          setOpen(nextOpen);
        },
      });

      closeFromHover = () => {
        context.rootStore.setOpen(
          false,
          createChangeEventDetails(REASONS.triggerHover, new MouseEvent('mouseleave')),
        );
      };

      const hoverProps = useHoverReferenceInteraction(context, {
        mouseOnly: true,
        move: false,
        delay: { open: 500, close: 0 },
        triggerElementRef,
        isClosing: () => !open,
      });

      return (
        <React.Fragment>
          <div
            data-testid="wrapper"
            {...hoverProps}
            ref={(node) => {
              triggerElementRef.current = node;
            }}
          >
            <button
              data-testid="trigger"
              ref={(node) => {
                refs.setReference(node);
              }}
            />
          </div>
          {open && <div role="tooltip" ref={refs.setFloating} />}
        </React.Fragment>
      );
    }

    render(<App />);

    const wrapper = screen.getByTestId('wrapper');
    await flushMicrotasks();

    await act(async () => {
      closeFromHover?.();
    });

    await flushMicrotasks();
    expect(screen.queryByRole('tooltip')).toBe(null);

    fireEvent.pointerEnter(wrapper, { pointerType: 'mouse' });
    fireEvent.mouseEnter(wrapper);

    await flushMicrotasks();

    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange.mock.calls[1][0]).toBe(true);
    expect(screen.queryByRole('tooltip')).not.toBe(null);
  });

  // Behavior previously only exercised through `useHover`, now covered against the
  // production hook directly.
  describe('hover open/close behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function HoverApp({
      showReference = true,
      ...props
    }: UseHoverReferenceInteractionProps & { showReference?: boolean }) {
      const [open, setOpen] = React.useState(false);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange(nextOpen) {
          setOpen(nextOpen);
        },
      });
      const hoverProps = useHoverReferenceInteraction(context, { triggerElementRef, ...props });

      return (
        <React.Fragment>
          {showReference && (
            <button
              ref={(node) => {
                refs.setReference(node);
                triggerElementRef.current = node;
              }}
              {...hoverProps}
            />
          )}
          {open && <div role="tooltip" ref={refs.setFloating} />}
        </React.Fragment>
      );
    }

    it('opens on mouseenter and closes on mouseleave', () => {
      render(<HoverApp />);
      const button = screen.getByRole('button');

      fireEvent.mouseEnter(button);
      expect(screen.queryByRole('tooltip')).not.toBe(null);

      fireEvent.mouseLeave(button);
      expect(screen.queryByRole('tooltip')).toBe(null);
    });

    it('waits for a symmetric numeric delay before opening', async () => {
      render(<HoverApp delay={1000} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(999);
      });
      expect(screen.queryByRole('tooltip')).toBe(null);

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('tooltip')).not.toBe(null);
    });

    it('waits for the open delay from a delay object', async () => {
      render(<HoverApp delay={{ open: 500 }} />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        vi.advanceTimersByTime(499);
      });
      expect(screen.queryByRole('tooltip')).toBe(null);

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('tooltip')).not.toBe(null);
    });

    it('waits for the close delay from a delay object', async () => {
      render(<HoverApp delay={{ close: 500 }} />);
      const button = screen.getByRole('button');

      fireEvent.mouseEnter(button);
      expect(screen.queryByRole('tooltip')).not.toBe(null);

      fireEvent.mouseLeave(button);

      await act(async () => {
        vi.advanceTimersByTime(499);
      });
      expect(screen.queryByRole('tooltip')).not.toBe(null);

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('tooltip')).toBe(null);
    });

    it('cancels the pending open when leaving before the open delay elapses', async () => {
      render(<HoverApp delay={{ open: 500 }} />);
      const button = screen.getByRole('button');

      fireEvent.mouseEnter(button);

      await act(async () => {
        vi.advanceTimersByTime(499);
      });

      fireEvent.mouseLeave(button);

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('tooltip')).toBe(null);
    });

    it('opens only once the cursor rests (restMs)', async () => {
      render(<HoverApp restMs={100} />);
      const button = screen.getByRole('button');

      const originalDispatchEvent = button.dispatchEvent;
      const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
        Object.defineProperty(event, 'movementX', { value: 10, configurable: true });
        Object.defineProperty(event, 'movementY', { value: 10, configurable: true });
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
      expect(screen.queryByRole('tooltip')).toBe(null);

      fireEvent.mouseMove(button);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.queryByRole('tooltip')).not.toBe(null);

      spy.mockRestore();
    });

    it('does not reset the rest timer for insignificant movement', async () => {
      render(<HoverApp restMs={100} />);
      const button = screen.getByRole('button');

      const originalDispatchEvent = button.dispatchEvent;
      const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
        Object.defineProperty(event, 'movementX', { value: 1, configurable: true });
        Object.defineProperty(event, 'movementY', { value: 0, configurable: true });
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
      expect(screen.queryByRole('tooltip')).not.toBe(null);

      spy.mockRestore();
    });

    // Regression test: a delayed hover open must not re-fire `onOpenChange(true)`
    // (clobbering `instantType`) if something else opened the popup while the
    // hover delay was still pending.
    it('does not re-fire open if the popup was opened during the hover delay', async () => {
      const onOpenChange = vi.fn();
      let openViaFocus: (() => void) | null = null;

      function App() {
        const [open, setOpen] = React.useState(false);
        const triggerElementRef = React.useRef<Element | null>(null);
        const { refs, context } = useFloating({
          open,
          onOpenChange(nextOpen, details) {
            onOpenChange(nextOpen, details);
            setOpen(nextOpen);
          },
        });

        openViaFocus = () => {
          context.rootStore.setOpen(
            true,
            createChangeEventDetails(REASONS.triggerFocus, new FocusEvent('focusin')),
          );
        };

        const hoverProps = useHoverReferenceInteraction(context, {
          delay: { open: 500 },
          move: false,
          triggerElementRef,
        });

        return (
          <React.Fragment>
            <button
              ref={(node) => {
                refs.setReference(node);
                triggerElementRef.current = node;
              }}
              {...hoverProps}
            />
            {open && <div role="tooltip" ref={refs.setFloating} />}
          </React.Fragment>
        );
      }

      render(<App />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      await act(async () => {
        openViaFocus?.();
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const openCalls = onOpenChange.mock.calls.filter(([nextOpen]) => nextOpen === true);
      expect(openCalls).toHaveLength(1);
      expect(openCalls[0][1].reason).toBe(REASONS.triggerFocus);
    });

    // Regression test: the hover state (and its timers) is shared across every
    // trigger and the popup. Unmounting one consumer (e.g. the popup during an
    // exit transition) must not cancel another consumer's pending open.
    it('keeps a pending open when another hover consumer unmounts', async () => {
      function ExtraConsumer({ context }: { context: ReturnType<typeof useFloating>['context'] }) {
        useHoverFloatingInteraction(context, {});
        return null;
      }

      function App({ showExtra }: { showExtra: boolean }) {
        const [open, setOpen] = React.useState(false);
        const triggerElementRef = React.useRef<Element | null>(null);
        const { refs, context } = useFloating({
          open,
          onOpenChange(nextOpen) {
            setOpen(nextOpen);
          },
        });
        const hoverProps = useHoverReferenceInteraction(context, {
          delay: { open: 500 },
          move: false,
          triggerElementRef,
        });

        return (
          <React.Fragment>
            <button
              ref={(node) => {
                refs.setReference(node);
                triggerElementRef.current = node;
              }}
              {...hoverProps}
            />
            {showExtra && <ExtraConsumer context={context} />}
            {open && <div role="tooltip" ref={refs.setFloating} />}
          </React.Fragment>
        );
      }

      const { rerender } = render(<App showExtra />);

      // Start the delayed open, then unmount the other consumer mid-delay.
      fireEvent.mouseEnter(screen.getByRole('button'));
      rerender(<App showExtra={false} />);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.queryByRole('tooltip')).not.toBe(null);
    });
  });
});
