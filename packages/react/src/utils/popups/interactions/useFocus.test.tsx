import { expect, vi, beforeEach, afterEach, it } from 'vitest';
import { act, fireEvent, render, screen } from '@mui/internal-test-utils';
import * as React from 'react';
import { createRenderer, isJSDOM, useTestInteractions } from '#test-utils';
import { useFloating } from '../../../../test/floating-ui-tests/useFloating';
import { useFocus } from './useFocus';
import { useDismiss } from './useDismiss';

describe.skipIf(!isJSDOM)('useFocus', () => {
  const { render: renderPopup } = createRenderer();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on focus again after being disabled following Escape dismissal', async () => {
    const { setProps } = await renderPopup(<FocusPopup enabled />);
    const button = screen.getByRole('button');

    await act(async () => button.focus());
    expect(screen.getByRole('tooltip')).toBeVisible();

    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBe(null);

    await setProps({ enabled: false });
    // While disabled, the blur handler cannot clear the dismissal block.
    await act(async () => button.blur());
    await setProps({ enabled: true });

    await act(async () => button.focus());
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('does not reopen on restored focus after Escape while still enabled', async () => {
    await renderPopup(<FocusPopup enabled />);
    const button = screen.getByRole('button');

    await act(async () => button.focus());
    expect(screen.getByRole('tooltip')).toBeVisible();

    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBe(null);

    fireEvent.focus(button);
    expect(screen.queryByRole('tooltip')).toBe(null);
  });

  it('does not reopen when focus is restored after leaving the tab', async () => {
    function App() {
      const [open, setOpen] = React.useState(false);
      const { refs, context } = useFloating({
        open,
        onOpenChange: setOpen,
      });
      const { getReferenceProps, getFloatingProps } = useTestInteractions([
        useFocus(context.rootStore, { delay: 100 }),
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

function FocusPopup({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = React.useState(false);
  const { refs, context } = useFloating({ open, onOpenChange: setOpen });
  const { getReferenceProps, getFloatingProps } = useTestInteractions([
    useFocus(context.rootStore, { enabled }),
    useDismiss(context.rootStore),
  ]);

  return (
    <React.Fragment>
      <button {...getReferenceProps({ ref: refs.setReference })}>Trigger</button>
      {open && <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />}
    </React.Fragment>
  );
}
