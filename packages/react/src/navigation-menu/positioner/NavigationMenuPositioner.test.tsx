import { beforeEach, expect, vi } from 'vitest';
import * as React from 'react';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const useNavigationMenuAnchorPositioningSpy = vi.hoisted(() => vi.fn());

vi.mock('../utils/useNavigationMenuAnchorPositioning', async () => {
  const actual = await vi.importActual<
    typeof import('../utils/useNavigationMenuAnchorPositioning')
  >('../utils/useNavigationMenuAnchorPositioning');

  return {
    ...actual,
    useNavigationMenuAnchorPositioning: ((
      ...args: Parameters<typeof actual.useNavigationMenuAnchorPositioning>
    ) => {
      useNavigationMenuAnchorPositioningSpy(...args);
      return actual.useNavigationMenuAnchorPositioning(...args);
    }) satisfies typeof actual.useNavigationMenuAnchorPositioning,
  };
});

describe('<NavigationMenu.Positioner />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    useNavigationMenuAnchorPositioningSpy.mockClear();
  });

  describeConformance(<NavigationMenu.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <NavigationMenu.Root value="test">
          <NavigationMenu.Portal>{node}</NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );
    },
  }));

  it('uses the layout viewport', async () => {
    await render(
      <NavigationMenu.Root value="test">
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner />
        </NavigationMenu.Portal>
      </NavigationMenu.Root>,
    );

    expect(useNavigationMenuAnchorPositioningSpy.mock.lastCall?.[0].shift).toEqual({
      rootBoundary: 'layoutViewport',
    });
  });

  it('throws a descriptive error when rendered outside <NavigationMenu.Portal>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <NavigationMenu.Root value="test">
            <NavigationMenu.Positioner />
          </NavigationMenu.Root>,
        ),
      ).rejects.toThrow('Base UI: <NavigationMenu.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });
  // `NavigationMenu.Positioner` deliberately blocks hit testing instead of going `inert`: focus can
  // be inside the panel and is only restored once the popup unmounts, so `inert` would blur it for
  // the whole exit animation.
  describe.skipIf(isJSDOM)('closing panel', () => {
    const style = `
      @keyframes navigation-menu-close-test {
        to {
          opacity: 0;
        }
      }

      .animation-test-popup[data-ending-style] {
        animation: navigation-menu-close-test 500ms linear;
      }
    `;

    it('keeps focus inside and only blocks hit testing while it animates out', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(
        <React.Fragment>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <NavigationMenu.Root>
            <NavigationMenu.List>
              <NavigationMenu.Item>
                <NavigationMenu.Trigger data-testid="trigger">Products</NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <NavigationMenu.Link href="#one" data-testid="inside">
                    First link
                  </NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            <NavigationMenu.Portal>
              <NavigationMenu.Positioner data-testid="positioner">
                <NavigationMenu.Popup data-testid="popup" className="animation-test-popup">
                  <NavigationMenu.Viewport />
                </NavigationMenu.Popup>
              </NavigationMenu.Positioner>
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        </React.Fragment>,
      );

      await user.click(screen.getByTestId('trigger'));

      const inside = await screen.findByTestId('inside');
      // `NavigationMenu.Content` tracks focus in state, so the move has to be wrapped.
      await act(async () => {
        inside.focus();
      });
      expect(inside).toHaveFocus();

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style'));

      const positioner = screen.getByTestId('positioner');
      expect(positioner).not.toHaveAttribute('inert');
      expect(positioner.style.pointerEvents).toBe('none');
    });
  });
});
