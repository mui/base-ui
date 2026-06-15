import { vi, expect } from 'vitest';
import { act, fireEvent, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { isJSDOM, useTestInteractions } from '#test-utils';
import { useFloating } from './useFloating';
import { useFocus } from './useFocus';

describe.skipIf(!isJSDOM)('useFocus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function App({ delay }: { delay?: number }) {
    const [open, setOpen] = React.useState(false);
    const { refs, context } = useFloating({
      open,
      onOpenChange(nextOpen) {
        setOpen(nextOpen);
      },
    });
    const { getReferenceProps, getFloatingProps } = useTestInteractions([
      useFocus(context, { delay }),
    ]);

    return (
      <React.Fragment>
        <button {...getReferenceProps({ ref: refs.setReference })} />
        {open && <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />}
      </React.Fragment>
    );
  }

  it('opens when the reference is focused', async () => {
    render(<App />);

    await act(async () => {
      screen.getByRole('button').focus();
    });

    expect(screen.queryByRole('tooltip')).not.toBe(null);
  });

  // Regression test: leaving the tab while the reference is focused but the popup
  // is still closed must block the reopen that fires when the browser restores
  // focus to the same reference on return.
  it('does not reopen when focus is restored after leaving the tab', async () => {
    render(<App delay={100} />);
    const button = screen.getByRole('button');

    // Focusing schedules a delayed open, so the popup is still closed.
    await act(async () => {
      button.focus();
    });
    expect(screen.queryByRole('tooltip')).toBe(null);

    // Leave the tab while the reference is focused and closed.
    await act(async () => {
      window.dispatchEvent(new Event('blur'));
    });

    // Returning to the tab restores focus to the same reference.
    fireEvent.focus(button);

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('tooltip')).toBe(null);
  });
});
