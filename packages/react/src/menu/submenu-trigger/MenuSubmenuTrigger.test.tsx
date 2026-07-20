import { afterEach, beforeEach, vi, expect } from 'vitest';
import { act, fireEvent, waitFor, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Menu } from '@base-ui/react/menu';
import { SafeReact } from '@base-ui/utils/safeReact';

type TextDirection = 'ltr' | 'rtl';

describe('<Menu.SubmenuTrigger />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  async function waitForAnimationFrame() {
    await act(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        }),
    );
  }

  afterEach(waitForAnimationFrame);

  describeConformance(<Menu.SubmenuTrigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.SubmenuRoot>{node}</Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
    },
  }));

  it('throws when rendered outside Menu.SubmenuRoot', async () => {
    await expect(render(<Menu.SubmenuTrigger />)).rejects.toThrow(
      'Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.',
    );
  });

  function TestComponent({ direction = 'ltr' }: { direction: TextDirection }) {
    return (
      <DirectionProvider direction={direction}>
        <Menu.Root open>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger>2</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Item>2.1</Menu.Item>
                        <Menu.Item>2.2</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </DirectionProvider>
    );
  }

  const testCases = [
    { direction: 'ltr', openKey: 'ArrowRight', closeKey: 'ArrowLeft' },
    { direction: 'rtl', openKey: 'ArrowLeft', closeKey: 'ArrowRight' },
  ];

  testCases.forEach(({ direction, openKey }) => {
    it(`opens the submenu with ${openKey} and highlights a single item in ${direction.toUpperCase()} direction`, async () => {
      await render(<TestComponent direction={direction as TextDirection} />);
      const submenuTrigger = screen.getByText('2');

      fireEvent.focus(submenuTrigger);
      fireEvent.keyDown(submenuTrigger, { key: openKey });

      const submenuItems = await screen.findAllByRole('menuitem');
      const submenuItem1 = submenuItems.find((item) => item.textContent === '2.1');

      await waitFor(() => {
        expect(submenuItem1).toHaveFocus();
      });

      submenuItems.forEach((item) => {
        if (item === submenuItem1) {
          expect(item).toHaveAttribute('data-highlighted');
        } else {
          expect(item).not.toHaveAttribute('data-highlighted');
        }
      });

      // Check that parent menu items are not active
      const parentMenuItems = screen
        .getAllByRole('menuitem')
        .filter((item) => item.textContent !== '2.1' && item.textContent !== '2.2');
      parentMenuItems.forEach((item) => {
        expect(item).not.toHaveAttribute('data-highlighted');
      });
    });
  });

  it('sets tabIndex to 0 on the submenu trigger after opening the submenu with a keydown event', async () => {
    await render(<TestComponent direction="ltr" />);
    const submenuTrigger = screen.getByText('2');

    fireEvent.focus(submenuTrigger);
    fireEvent.keyDown(submenuTrigger, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(submenuTrigger).toHaveAttribute('tabIndex', '0');
    });
  });

  it('uses the label prop for text navigation', async () => {
    const { user } = await render(
      <Menu.Root open>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Alpha</Menu.Item>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger data-testid="submenu-trigger" label="Reports">
                  More
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup>
                      <Menu.Item>Monthly</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    fireEvent.focus(screen.getByText('Alpha'));
    await user.keyboard('r');

    await waitFor(() => {
      expect(screen.getByTestId('submenu-trigger')).toHaveFocus();
    });
  });

  describe('prop: disabled', () => {
    it('should render with disabled attributes when disabled prop is set', async () => {
      await render(
        <Menu.Root open>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger disabled>Open submenu</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu-popup">
                        <Menu.Item>2.1</Menu.Item>
                        <Menu.Item>2.2</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Open submenu' });

      expect(submenuTrigger).toHaveAttribute('data-disabled');
      expect(submenuTrigger).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not open on hover when disabled', async () => {
      const { user } = await render(
        <Menu.Root open>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger disabled delay={0}>
                    Open submenu
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu-popup">
                        <Menu.Item>2.1</Menu.Item>
                        <Menu.Item>2.2</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const submenuTrigger = screen.getByRole('menuitem', { name: 'Open submenu' });

      await user.hover(submenuTrigger);

      expect(screen.queryByTestId('submenu-popup')).toBe(null);
    });

    it('should warn when a disabled element is detected via render prop with JSX element', async () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockName('console.warn')
        .mockImplementation(() => {});
      vi.spyOn(SafeReact, 'captureOwnerStack').mockReturnValue(undefined as never);

      await render(
        <Menu.Root open>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger
                    nativeButton
                    render={<button type="button" disabled={true} />}
                  >
                    Open submenu
                  </Menu.SubmenuTrigger>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Base UI: A disabled element was detected on <Menu.SubmenuTrigger>. To properly disable the trigger, use the `disabled` prop on the component instead of setting it on the rendered element.',
        ),
      );
      expect(warnSpy.mock.lastCall?.[0]).not.toContain('undefined');
    });

    it.skipIf(!isJSDOM)('does not inspect rendered disabled elements in production', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        await render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger
                      nativeButton
                      render={<button type="button" disabled={true} />}
                    >
                      Open submenu
                    </Menu.SubmenuTrigger>
                  </Menu.SubmenuRoot>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });
});
