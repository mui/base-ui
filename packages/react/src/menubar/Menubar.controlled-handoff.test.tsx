import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';

/**
 * A controlled Menubar: one piece of state names the open menu, exactly as an
 * application does when it drives the menubar itself. Closes arriving from a
 * menu which is not the open one are stale and ignored — without that guard
 * the harness clobbers its own state and measures its own bug, not the
 * library's.
 *
 * The swap is performed through `apiRef`, i.e. with NO user event at all: the
 * application simply moves its own state. That is the case this file is about.
 */
function ControlledMenubar({
  log,
  apiRef,
}: {
  log: string[];
  apiRef: React.RefObject<((next: string | null) => void) | null>;
}) {
  const [openMenu, setState] = React.useState<string | null>(null);
  const openRef = React.useRef<string | null>(null);

  const commit = React.useCallback(
    (next: string | null, from: string) => {
      if (next === null && openRef.current !== from) {
        log.push(`ignored-stale-close(${from})`);
        return;
      }
      openRef.current = next;
      log.push(`${next}:${from}`);
      setState(next);
    },
    [log],
  );

  apiRef.current = (next) => commit(next, 'app');

  const menu = (id: string) => (
    <Menu.Root
      key={id}
      open={openMenu === id}
      onOpenChange={(next) => commit(next ? id : null, id)}
    >
      <Menu.Trigger data-testid={`trigger-${id}`}>{id}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup data-testid={`popup-${id}`}>
            <Menu.Item>{id} item</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );

  return (
    <Menubar>
      {menu('a')}
      {menu('b')}
    </Menubar>
  );
}

describe('<Menubar /> controlled handoff', () => {
  const { render } = createRenderer();

  for (const animationsDisabled of [true, false]) {
    describe(`animations ${animationsDisabled ? 'disabled' : 'enabled'}`, () => {
      beforeEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
      });

      it('moves the open menu when the application changes the controlled value', async () => {
        const log: string[] = [];
        const apiRef = React.createRef<((next: string | null) => void) | null>();
        await render(<ControlledMenubar log={log} apiRef={apiRef} />);

        await act(async () => {
          apiRef.current!('a');
        });
        await waitFor(() => {
          expect(screen.queryByTestId('popup-a')).not.to.equal(null);
        });

        log.length = 0;
        await act(async () => {
          apiRef.current!('b');
        });

        await waitFor(() => {
          expect(screen.queryByTestId('popup-b')).not.to.equal(null);
        });
        expect(
          screen.queryByTestId('popup-a'),
          `menu "a" reopened itself; log: ${JSON.stringify(log)}`,
        ).to.equal(null);
      });

      it('moves the open menu when the swap happens from an open menu with focus inside it', async () => {
        const log: string[] = [];
        const apiRef = React.createRef<((next: string | null) => void) | null>();
        const { user } = await render(<ControlledMenubar log={log} apiRef={apiRef} />);

        // Open "a" the way a user does, so focus really is inside its popup.
        await user.click(screen.getByTestId('trigger-a'));
        await waitFor(() => {
          expect(screen.queryByTestId('popup-a')).not.to.equal(null);
        });

        log.length = 0;
        await act(async () => {
          apiRef.current!('b');
        });

        await waitFor(() => {
          expect(screen.queryByTestId('popup-b')).not.to.equal(null);
        });
        expect(
          screen.queryByTestId('popup-a'),
          `menu "a" reopened itself; log: ${JSON.stringify(log)}`,
        ).to.equal(null);
      });
    });
  }
});
