import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { isJSDOM } from '#test-utils';
import { useFloating } from './useFloating';
import { useHoverFloatingInteraction } from './useHoverFloatingInteraction';
import { useHoverReferenceInteraction } from './useHoverReferenceInteraction';

describe.skipIf(!isJSDOM)('useHoverFloatingInteraction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function App(props: { closeDelay?: number }) {
    const [open, setOpen] = React.useState(false);
    const triggerElementRef = React.useRef<Element | null>(null);
    const { refs, context } = useFloating({ open, onOpenChange: setOpen });
    const referenceProps = useHoverReferenceInteraction(context, {
      triggerElementRef,
      delay: { close: props.closeDelay },
    });
    useHoverFloatingInteraction(context, { closeDelay: props.closeDelay });

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

  it('closes after the close delay when the pointer leaves the floating element', async () => {
    render(<App closeDelay={100} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    await flushMicrotasks();

    const tooltip = screen.getByRole('tooltip');
    fireEvent(button, new MouseEvent('mouseleave', { relatedTarget: tooltip }));
    fireEvent.mouseEnter(tooltip);
    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(99);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keeps the popup open when the floating element is entered before closeDelay elapses', async () => {
    render(<App closeDelay={500} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    await flushMicrotasks();

    const tooltip = screen.getByRole('tooltip');
    fireEvent(button, new MouseEvent('mouseleave', { relatedTarget: tooltip }));

    await act(async () => {
      vi.advanceTimersByTime(499);
    });

    fireEvent.mouseEnter(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(499);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
