import { expect, vi } from 'vitest';
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

  it('does not reopen when focus is restored after leaving the tab', async () => {
    function App() {
      const [open, setOpen] = React.useState(false);
      const { refs, context } = useFloating({
        open,
        onOpenChange: setOpen,
      });
      const { getReferenceProps, getFloatingProps } = useTestInteractions([
        useFocus(context, { delay: 100 }),
      ]);

      return (
        <React.Fragment>
          <button {...getReferenceProps({ ref: refs.setReference })} />
          {open && <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />}
        </React.Fragment>
      );
    }

    render(<App />);
    const button = screen.getByRole('button');

    await act(async () => {
      button.focus();
    });

    window.dispatchEvent(new Event('blur'));
    fireEvent.focus(button);

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('tooltip')).toBe(null);
  });
});
