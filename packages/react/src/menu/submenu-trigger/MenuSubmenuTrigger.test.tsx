import { expect } from 'chai';
import { fireEvent, waitFor, screen } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Menu } from '@base-ui/react/menu';
import { MenuStore } from '../store/MenuStore';

type TextDirection = 'ltr' | 'rtl';

describe('<Menu.SubmenuTrigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.SubmenuRoot>{node}</Menu.SubmenuRoot>
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
          expect(item).to.have.attribute('data-highlighted');
        } else {
          expect(item).not.to.have.attribute('data-highlighted');
        }
      });

      // Check that parent menu items are not active
      const parentMenuItems = screen
        .getAllByRole('menuitem')
        .filter((item) => item.textContent !== '2.1' && item.textContent !== '2.2');
      parentMenuItems.forEach((item) => {
        expect(item).not.to.have.attribute('data-highlighted');
      });
    });
  });

  it('sets tabIndex to 0 on the submenu trigger after opening the submenu with a keydown event', async () => {
    await render(<TestComponent direction="ltr" />);
    const submenuTrigger = screen.getByText('2');

    fireEvent.focus(submenuTrigger);
    fireEvent.keyDown(submenuTrigger, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(submenuTrigger).to.have.attribute('tabIndex', '0');
    });
  });

  it.skipIf(isJSDOM)(
    'perf: does not fan out unrelated parent updates to sibling submenu stores',
    async () => {
      const notifyAllSpy = spy(MenuStore.prototype, 'notifyAll');

      try {
        const submenuCount = 24;

        const { user } = await render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  {Array.from({ length: submenuCount }).map((_, i) => (
                    <Menu.SubmenuRoot key={i}>
                      <Menu.SubmenuTrigger
                        delay={0}
                        closeDelay={0}
                        data-testid={`submenu-trigger-${i}`}
                      >
                        Submenu {i}
                      </Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.Item>Item {i}.1</Menu.Item>
                            <Menu.Item>Item {i}.2</Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        for (let i = 0; i < submenuCount; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await user.hover(screen.getByTestId(`submenu-trigger-${i}`));
        }

        for (let i = submenuCount - 1; i >= 0; i -= 1) {
          // eslint-disable-next-line no-await-in-loop
          await user.hover(screen.getByTestId(`submenu-trigger-${i}`));
        }

        expect(notifyAllSpy.callCount).to.equal(0);
      } finally {
        notifyAllSpy.restore();
      }
    },
  );
});
