import { vi, expect } from 'vitest';
import { fireEvent, waitFor, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Menu } from '@base-ui/react/menu';
import { REASONS } from '../../internals/reasons';
import { isMacVoiceOver } from '../utils/isMacVoiceOver';

vi.mock('../utils/isMacVoiceOver', () => {
  return {
    isMacVoiceOver: vi.fn(() => false),
  };
});

type TextDirection = 'ltr' | 'rtl';

describe('<Menu.SubmenuTrigger />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.mocked(isMacVoiceOver).mockReturnValue(false);
  });

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
                      <Menu.Popup data-testid="submenu">
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

  it('exposes the ARIA relationship when opened with keyboard', async () => {
    const { user } = await render(
      <Menu.Root open>
        <Menu.Trigger>Open menu</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu" />
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const submenuTrigger = screen.getByText('More');

    await user.click(submenuTrigger);
    await user.keyboard('{ArrowRight}');

    const submenu = await screen.findByTestId('submenu');

    expect(submenuTrigger).toHaveFocus();
    expect(submenuTrigger).toHaveAttribute('data-popup-open');
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(submenuTrigger).toHaveAttribute('aria-controls', submenu.id);
    expect(submenu).toHaveAttribute('aria-labelledby', submenuTrigger.id);
  });

  describe('macOS VoiceOver', () => {
    beforeEach(() => {
      vi.mocked(isMacVoiceOver).mockReturnValue(true);
    });

    it('defers the ARIA relationship while a keyboard-opened submenu trigger keeps focus', async () => {
      const { user } = await render(
        <Menu.Root open>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu" />
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const submenuTrigger = screen.getByText('More');

      await user.click(submenuTrigger);
      await user.keyboard('{ArrowRight}');

      const submenu = await screen.findByTestId('submenu');

      expect(submenuTrigger).toHaveFocus();
      expect(submenuTrigger).toHaveAttribute('data-popup-open');
      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(submenuTrigger).not.toHaveAttribute('aria-controls');
      expect(submenu).not.toHaveAttribute('aria-labelledby');
    });

    it.each([
      ['Enter', '[Enter]'],
      ['Space', '[Space]'],
    ])('defers the ARIA relationship when opened with %s', async (_keyName, key) => {
      const handleOpenChange = vi.fn();

      const { user } = await render(
        <Menu.Root open>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.SubmenuRoot onOpenChange={handleOpenChange}>
                  <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu" />
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const submenuTrigger = screen.getByText('More');

      await user.click(submenuTrigger);
      await user.keyboard(key);

      const submenu = await screen.findByTestId('submenu');

      expect(handleOpenChange).toHaveBeenCalledTimes(1);
      expect(handleOpenChange.mock.lastCall?.[0]).toBe(true);
      expect(handleOpenChange.mock.lastCall?.[1].reason).toBe(REASONS.triggerPress);
      expect(submenuTrigger).toHaveFocus();
      expect(submenuTrigger).toHaveAttribute('data-popup-open');
      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(submenuTrigger).not.toHaveAttribute('aria-controls');
      expect(submenu).not.toHaveAttribute('aria-labelledby');
    });

    it('keeps the ARIA relationship deferred after keyboard focus moves into the submenu', async () => {
      const { user } = await render(<TestComponent direction="ltr" />);
      const submenuTrigger = screen.getByText('2');

      await user.click(submenuTrigger);
      await user.keyboard('{ArrowRight}');

      const submenuItem = screen.getByText('2.1');
      await waitFor(() => {
        expect(submenuItem).toHaveFocus();
      });

      const submenu = screen.getByTestId('submenu');

      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(submenuTrigger).not.toHaveAttribute('aria-controls');
      expect(submenu).not.toHaveAttribute('aria-labelledby');
    });

    it('exposes the ARIA relationship when the submenu is opened by click', async () => {
      const { user } = await render(
        <Menu.Root open>
          <Menu.Trigger>Open menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger openOnHover={false}>More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu">
                        <Menu.Item>Child</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const submenuTrigger = screen.getByText('More');

      await user.click(submenuTrigger);

      const submenu = await screen.findByTestId('submenu');

      expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
      expect(submenuTrigger).toHaveAttribute('aria-controls', submenu.id);
      expect(submenu).toHaveAttribute('aria-labelledby', submenuTrigger.id);
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
    });
  });
});
