import { expect, describe, it } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

describe('<Menu.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Menu.Root open>{node}</Menu.Root>);
    },
  }));

  [false, true].forEach((controlled) => {
    it(`does not start an entry phase when initially open (controlled=${controlled})`, async () => {
      const statuses = new Set<Menu.Backdrop.State['transitionStatus']>();

      function RecordState({ state }: { state: Menu.Backdrop.State }) {
        useIsoLayoutEffect(() => {
          statuses.add(state.transitionStatus);
        }, [state]);
        return null;
      }

      await render(
        <Menu.Root open={controlled ? true : undefined} defaultOpen={!controlled}>
          <Menu.Backdrop
            render={(props, state) => (
              <div {...props}>
                <RecordState state={state} />
              </div>
            )}
          />
        </Menu.Root>,
      );

      expect(statuses).toEqual(new Set([undefined]));
    });
  });

  it('sets `pointer-events: none` style on backdrop if opened by hover', async () => {
    const { user } = await render(
      <Menu.Root>
        <Menu.Trigger delay={0} openOnHover>
          Open
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Backdrop data-testid="backdrop" />
          <Menu.Positioner>
            <Menu.Popup />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await user.hover(screen.getByText('Open'));

    expect(screen.getByTestId('backdrop').style.pointerEvents).toBe('none');
  });

  it('does not set `pointer-events: none` style on backdrop if opened by click', async () => {
    const { user } = await render(
      <Menu.Root>
        <Menu.Trigger delay={0}>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Backdrop data-testid="backdrop" />
          <Menu.Positioner>
            <Menu.Popup />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByTestId('backdrop').style.pointerEvents).not.toBe('none');
    });
  });
});
