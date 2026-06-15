import { vi, expect } from 'vitest';
import { act, fireEvent, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { isJSDOM } from '#test-utils';
import { useFloating } from './useFloating';
import { useHoverReferenceInteraction } from './useHoverReferenceInteraction';
import {
  useHoverFloatingInteraction,
  type UseHoverFloatingInteractionProps,
} from './useHoverFloatingInteraction';

describe.skipIf(!isJSDOM)('useHoverFloatingInteraction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function App(props: UseHoverFloatingInteractionProps) {
    const [open, setOpen] = React.useState(false);
    const triggerElementRef = React.useRef<Element | null>(null);
    const { refs, context } = useFloating({
      open,
      onOpenChange(nextOpen) {
        setOpen(nextOpen);
      },
    });
    const hoverProps = useHoverReferenceInteraction(context, { move: false, triggerElementRef });
    useHoverFloatingInteraction(context, props);

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

  function openViaHover() {
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
  }

  it('closes on floating mouseleave after the close delay', async () => {
    render(<App closeDelay={200} />);
    openViaHover();
    expect(screen.queryByRole('tooltip')).not.toBe(null);

    const tooltip = screen.getByRole('tooltip');
    fireEvent.mouseEnter(tooltip);
    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.queryByRole('tooltip')).not.toBe(null);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole('tooltip')).toBe(null);
  });

  it('cancels a pending close when the cursor re-enters the floating element', async () => {
    render(<App closeDelay={200} />);
    openViaHover();

    const tooltip = screen.getByRole('tooltip');
    fireEvent.mouseEnter(tooltip);
    // Leaving the floating element schedules a close...
    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).not.toBe(null);

    // ...re-entering it cancels the pending close.
    fireEvent.mouseEnter(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('tooltip')).not.toBe(null);
  });

  it('supports a function-form close delay', async () => {
    render(<App closeDelay={() => 300} />);
    openViaHover();

    const tooltip = screen.getByRole('tooltip');
    fireEvent.mouseEnter(tooltip);
    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(screen.queryByRole('tooltip')).not.toBe(null);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole('tooltip')).toBe(null);
  });
});
