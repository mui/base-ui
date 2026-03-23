import { vi, expect } from 'vitest';
import { act, fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { isJSDOM } from '@base-ui/utils/detectBrowser';
import { useFloating } from './useFloating';
import { useHoverReferenceInteraction } from './useHoverReferenceInteraction';

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

  it('does not bypass open delay after mouseleave while already closed', async () => {
    vi.useFakeTimers();

    function App() {
      const [open, setOpen] = React.useState(false);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange: setOpen,
      });

      const hoverProps = useHoverReferenceInteraction(context, {
        delay: { open: 100, close: 0 },
        triggerElementRef,
      });

      return (
        <React.Fragment>
          <button
            data-testid="trigger"
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

    try {
      render(<App />);
      await flushMicrotasks();
      const trigger = screen.getByTestId('trigger');

      // Can happen during aborted hovers; should not seed hover handoff grace.
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseMove(trigger, { movementX: 10, movementY: 0 });

      expect(screen.queryByRole('tooltip')).toBe(null);

      await act(async () => {
        vi.advanceTimersByTime(99);
      });
      await flushMicrotasks();
      expect(screen.queryByRole('tooltip')).toBe(null);

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      await flushMicrotasks();
      expect(screen.queryByRole('tooltip')).not.toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not schedule a delayed close from mouseleave while already closed', async () => {
    vi.useFakeTimers();

    function App() {
      const [open, setOpen] = React.useState(false);
      const triggerElementRef = React.useRef<Element | null>(null);
      const { refs, context } = useFloating({
        open,
        onOpenChange: setOpen,
      });

      const hoverProps = useHoverReferenceInteraction(context, {
        delay: { open: 100, close: 300 },
        triggerElementRef,
      });

      return (
        <React.Fragment>
          <button
            data-testid="trigger"
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

    try {
      render(<App />);
      await flushMicrotasks();
      const trigger = screen.getByTestId('trigger');

      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(trigger);

      expect(screen.queryByRole('tooltip')).toBe(null);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      await flushMicrotasks();
      expect(screen.queryByRole('tooltip')).not.toBe(null);

      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      await flushMicrotasks();
      expect(screen.queryByRole('tooltip')).not.toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });
});
