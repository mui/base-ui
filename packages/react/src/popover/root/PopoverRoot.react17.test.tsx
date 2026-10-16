import { expect, vi, describe, it, beforeEach } from 'vitest';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      startTransition: undefined,
    },
  };
});

describe('<Popover.Root /> without startTransition', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  it('reports the completed close when an open request during the exit is ignored', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    let finishExit!: () => void;
    const exitFinished = new Promise<void>((resolve) => {
      finishExit = resolve;
    });
    let setOpenExternal!: (open: boolean) => void;
    let exiting = false;
    const calls: string[] = [];

    function App() {
      const [open, setOpen] = React.useState(false);
      setOpenExternal = setOpen;

      return (
        <Popover.Root
          open={open}
          onOpenChange={(nextOpen) => {
            calls.push(`change:${nextOpen}`);
            if (!exiting) {
              setOpen(nextOpen);
            }
          }}
          onOpenChangeComplete={(nextOpen) => calls.push(`complete:${nextOpen}`)}
        >
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal keepMounted>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup data-testid="popup">Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { user } = await render(<App />);
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popup = screen.getByTestId('popup');

    await user.click(trigger);
    await waitFor(() => {
      expect(trigger).toHaveAttribute('data-popup-open');
    });

    Object.defineProperty(popup, 'getAnimations', {
      value: () => [{ finished: exitFinished }],
      configurable: true,
    });

    await act(async () => setOpenExternal(false));
    expect(popup).toHaveAttribute('data-ending-style');

    exiting = true;
    await user.click(trigger);
    expect(calls.at(-1)).toBe('change:true');

    await act(async () => {
      finishExit();
    });
    await waitFor(() => {
      expect(screen.getByTestId('positioner')).toHaveAttribute('hidden');
    });

    expect(calls.at(-1)).toBe('complete:false');
  });
});
