import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, holdExit, isJSDOM, wait, waitSingleFrame } from '#test-utils';

describe('holdExit', () => {
  const { render } = createRenderer();

  function TestPopover(props: { open: boolean }) {
    return (
      <Popover.Root open={props.open}>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup data-testid="popup">Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  /** Gives an exit that isn't held the time to finish and unmount the popup. */
  async function waitForUnheldExit() {
    await waitSingleFrame();
    await waitSingleFrame();
    await wait(0);
  }

  describe.for(isJSDOM ? (['manual'] as const) : (['manual', 'animation'] as const))(
    '%s adapter',
    (adapter) => {
      it('keeps a closed popup mounted until released', async () => {
        const exit = holdExit({ adapter });
        const { setProps } = await render(<TestPopover open />);

        await setProps({ open: false });
        await waitForUnheldExit();

        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

        await exit.release();

        expect(screen.queryByTestId('popup')).toBe(null);
      });

      it('releases an exit that has not checked its animations yet', async () => {
        const exit = holdExit({ adapter });
        const { setProps } = await render(<TestPopover open />);

        await setProps({ open: false });
        await exit.release();

        expect(screen.queryByTestId('popup')).toBe(null);
      });

      it('holds an exit that starts after a release', async () => {
        const exit = holdExit({ adapter });
        const { setProps } = await render(<TestPopover open />);
        await setProps({ open: false });
        await exit.release();
        await setProps({ open: true });

        await setProps({ open: false });
        await waitForUnheldExit();

        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

        await exit.release();

        expect(screen.queryByTestId('popup')).toBe(null);
      });

      it('holds the exit that follows a reopen during the exit', async () => {
        const exit = holdExit({ adapter });
        const { setProps } = await render(<TestPopover open />);
        await setProps({ open: false });
        await waitForUnheldExit();
        await setProps({ open: true });

        await waitFor(() => {
          expect(screen.getByTestId('popup')).not.toHaveAttribute('data-ending-style');
        });

        await setProps({ open: false });
        await waitForUnheldExit();

        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

        await exit.release();

        expect(screen.queryByTestId('popup')).toBe(null);
      });
    },
  );
});
