import { vi, expect, it, describe, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { isJSDOM } from '#test-utils';
import { useFloating } from '../../../test/floating-ui-tests/useFloating';
import { safePolygon } from '../safePolygon';
import { useHoverFloatingInteraction } from './useHoverFloatingInteraction';
import { useHoverInteractionSharedState } from './useHoverInteractionSharedState';
import {
  useHoverReferenceInteraction,
  type UseHoverReferenceInteractionProps,
} from './useHoverReferenceInteraction';
import { REASONS } from '../../internals/reasons';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';

describe.skipIf(!isJSDOM)('useHoverReferenceInteraction', () => {
  it('updates the handleClose options during render', () => {
    let blockPointerEvents: boolean | undefined;

    function App({ block }: { block: boolean }) {
      const { context } = useFloating();
      useHoverReferenceInteraction(context, {
        handleClose: safePolygon({ blockPointerEvents: block }),
      });
      const hoverInteraction = useHoverInteractionSharedState(context.rootStore);
      blockPointerEvents = hoverInteraction.handleCloseOptions?.blockPointerEvents;

      return null;
    }

    const { rerender } = render(<App block={false} />);
    expect(blockPointerEvents).toBe(false);

    rerender(<App block />);
    expect(blockPointerEvents).toBe(true);
  });

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

  describe('hover semantics', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function App(props: UseHoverReferenceInteractionProps) {
      const [open, setOpen] = React.useState(false);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({ open, onOpenChange: setOpen });
      const referenceProps = useHoverReferenceInteraction(context, {
        triggerElementRef,
        ...props,
      });
      useHoverFloatingInteraction(context);

      return (
        <React.Fragment>
          <button
            {...referenceProps}
            ref={(node) => {
              refs.setReference(node);
              triggerElementRef.current = node;
            }}
          />
          {open && <div role="tooltip" ref={refs.setFloating} />}
        </React.Fragment>
      );
    }

    it('opens on mouseenter', async () => {
      render(<App />);

      fireEvent.mouseEnter(screen.getByRole('button'));

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      await flushMicrotasks();
    });

    it('closes on mouseleave', () => {
      render(<App />);

      fireEvent.mouseEnter(screen.getByRole('button'));
      fireEvent.mouseLeave(screen.getByRole('button'));

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('closes when the pointer moves onto the floating element without safePolygon', async () => {
      render(<App />);

      fireEvent.mouseEnter(screen.getByRole('button'));
      await flushMicrotasks();

      fireEvent(
        screen.getByRole('button'),
        new MouseEvent('mouseleave', { relatedTarget: screen.getByRole('tooltip') }),
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    describe('prop: delay', () => {
      it('symmetric number', async () => {
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
      });

      it('open', async () => {
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
      });

      it('close', async () => {
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
      });

      it('open with close 0', async () => {
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
      });

      it('restMs + nullish open delay should respect restMs', async () => {
        render(<App restMs={100} delay={{ close: 100 }} />);

        fireEvent.mouseEnter(screen.getByRole('button'));

        await act(async () => {
          vi.advanceTimersByTime(99);
        });

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('restMs', async () => {
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
    });

    it('restMs does not reset timer for minor mouse movement', async () => {
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
    });

    it('reports the hover reason', async () => {
      const reasons: string[] = [];

      function ReasonApp() {
        const [open, setOpen] = React.useState(false);
        const triggerElementRef = React.useRef<Element | null>(null);
        const { refs, context } = useFloating({
          open,
          onOpenChange(nextOpen, details) {
            reasons.push(details.reason);
            setOpen(nextOpen);
          },
        });
        const referenceProps = useHoverReferenceInteraction(context, { triggerElementRef });

        return (
          <React.Fragment>
            <button
              {...referenceProps}
              ref={(node) => {
                refs.setReference(node);
                triggerElementRef.current = node;
              }}
            />
            {open && <div role="tooltip" ref={refs.setFloating} />}
          </React.Fragment>
        );
      }

      render(<ReasonApp />);
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      await flushMicrotasks();
      fireEvent.mouseLeave(button);

      expect(reasons).toEqual([REASONS.triggerHover, REASONS.triggerHover]);
    });
  });
});
