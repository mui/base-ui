import * as React from 'react';
import { expect } from 'chai';
import { act, waitFor, screen } from '@mui/internal-test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, isJSDOM } from '#test-utils';

describe('<MenuRoot />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the menu with any trigger', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Trigger 1</Menu.Trigger>
          <Menu.Trigger>Trigger 2</Menu.Trigger>
          <Menu.Trigger>Trigger 3</Menu.Trigger>

          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Close</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByRole('menu')).to.equal(null);

      await user.click(trigger1);
      await screen.findByRole('menu');
      await user.click(await screen.findByRole('menuitem', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      await user.click(trigger2);
      await screen.findByRole('menu');
      await user.click(await screen.findByRole('menuitem', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      await user.click(trigger3);
      await screen.findByRole('menu');
      await user.click(await screen.findByRole('menuitem', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });
    });

    it('should set the payload and render content based on its value', async () => {
      const { user } = await render(
        <Menu.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Menu.Trigger payload={1}>Trigger 1</Menu.Trigger>
              <Menu.Trigger payload={2}>Trigger 2</Menu.Trigger>

              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="content">{payload}</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </React.Fragment>
          )}
        </Menu.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      await user.click(screen.getByTestId('content'));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const { user } = await render(
        <Menu.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Menu.Trigger payload={1}>Trigger 1</Menu.Trigger>
              <Menu.Trigger payload={2}>Trigger 2</Menu.Trigger>

              <Menu.Portal>
                <Menu.Positioner data-testid="positioner">
                  <Menu.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </React.Fragment>
          )}
        </Menu.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await screen.findByRole('menu');
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await user.click(trigger2);
      await screen.findByRole('menu');

      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the menu state programmatically', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div>
            <Menu.Root
              open={open}
              triggerId={activeTrigger}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
            >
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Menu.Trigger payload={1} id="trigger-1">
                    Trigger 1
                  </Menu.Trigger>
                  <Menu.Trigger payload={2} id="trigger-2">
                    Trigger 2
                  </Menu.Trigger>

                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Item data-testid="content">{payload}</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </React.Fragment>
              )}
            </Menu.Root>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });
    });

    it('allows setting an initially open menu', async () => {
      await render(
        <Menu.Root defaultOpen defaultTriggerId="trigger-2">
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Menu.Trigger payload={1} id="trigger-1">
                Trigger 1
              </Menu.Trigger>
              <Menu.Trigger payload={2} id="trigger-2">
                Trigger 2
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="popup-content">{payload}</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </React.Fragment>
          )}
        </Menu.Root>,
      );

      expect(screen.getByTestId('popup-content').textContent).to.equal('2');
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the menu with any trigger', async () => {
      const testMenu = Menu.createHandle();
      const { user } = await render(
        <div>
          <Menu.Trigger handle={testMenu}>Trigger 1</Menu.Trigger>
          <Menu.Trigger handle={testMenu}>Trigger 2</Menu.Trigger>
          <Menu.Trigger handle={testMenu}>Trigger 3</Menu.Trigger>

          <Menu.Root handle={testMenu}>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Close</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByRole('menu')).to.equal(null);

      await user.click(trigger1);
      await screen.findByRole('menu');
      await user.click(await screen.findByRole('menuitem', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      await user.click(trigger2);
      await screen.findByRole('menu');
      await user.click(await screen.findByRole('menuitem', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      await user.click(trigger3);
      await screen.findByRole('menu');
      await user.click(await screen.findByRole('menuitem', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });
    });

    it('should set the payload and render content based on its value', async () => {
      const testMenu = Menu.createHandle<number>();
      const { user } = await render(
        <div>
          <Menu.Trigger handle={testMenu} payload={1}>
            Trigger 1
          </Menu.Trigger>
          <Menu.Trigger handle={testMenu} payload={2}>
            Trigger 2
          </Menu.Trigger>

          <Menu.Root handle={testMenu}>
            {({ payload }: NumberPayload) => (
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="content">{payload}</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            )}
          </Menu.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      await user.click(screen.getByTestId('content'));
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const testMenu = Menu.createHandle<number>();
      const { user } = await render(
        <React.Fragment>
          <Menu.Trigger handle={testMenu} payload={1}>
            Trigger 1
          </Menu.Trigger>
          <Menu.Trigger handle={testMenu} payload={2}>
            Trigger 2
          </Menu.Trigger>

          <Menu.Root handle={testMenu}>
            {({ payload }: NumberPayload) => (
              <Menu.Portal>
                <Menu.Positioner data-testid="positioner">
                  <Menu.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            )}
          </Menu.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await screen.findByRole('menu');
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await user.click(trigger2);
      await screen.findByRole('menu');

      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the menu state programmatically', async () => {
      const testMenu = Menu.createHandle<number>();

      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div style={{ margin: 50 }}>
            <Menu.Trigger handle={testMenu} payload={1} id="trigger-1">
              Trigger 1
            </Menu.Trigger>
            <Menu.Trigger handle={testMenu} payload={2} id="trigger-2">
              Trigger 2
            </Menu.Trigger>

            <Menu.Root
              open={open}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
              triggerId={activeTrigger}
              handle={testMenu}
            >
              {({ payload }: NumberPayload) => (
                <Menu.Portal>
                  <Menu.Positioner data-testid="positioner" side="bottom" align="start">
                    <Menu.Popup>
                      <Menu.Item data-testid="content">{payload}</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              )}
            </Menu.Root>

            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      await waitFor(() => {
        const positionerLeft = screen.getByTestId('positioner').getBoundingClientRect().left;
        expect(positionerLeft).to.be.closeTo(trigger1.getBoundingClientRect().left, 1);
      });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });
      await waitFor(() => {
        const positionerLeft = screen.getByTestId('positioner').getBoundingClientRect().left;
        expect(positionerLeft).to.be.closeTo(trigger2.getBoundingClientRect().left, 1);
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });
    });

    it('allows setting an initially open menu', async () => {
      const testMenu = Menu.createHandle<number>();
      await render(
        <Menu.Root handle={testMenu} defaultOpen defaultTriggerId="trigger-2">
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Menu.Trigger handle={testMenu} payload={1} id="trigger-1">
                Trigger 1
              </Menu.Trigger>
              <Menu.Trigger handle={testMenu} payload={2} id="trigger-2">
                Trigger 2
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="popup-content">{payload}</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </React.Fragment>
          )}
        </Menu.Root>,
      );

      expect(screen.getByTestId('popup-content').textContent).to.equal('2');
    });
  });

  describe.skipIf(isJSDOM)('imperative actions on the handle', () => {
    type NumberPayload = { payload: number | undefined };

    it('opens and closes the menu', async () => {
      const menuHandle = Menu.createHandle();
      await render(
        <div>
          <Menu.Trigger handle={menuHandle} id="trigger">
            Trigger
          </Menu.Trigger>
          <Menu.Root handle={menuHandle}>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup data-testid="content">
                  <Menu.Item>Content</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(screen.queryByRole('menu')).to.equal(null);

      await act(async () => {
        menuHandle.open('trigger');
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('Content');
      expect(trigger).to.have.attribute('aria-expanded', 'true');

      await act(async () => {
        menuHandle.close();
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
    });

    it('sets the payload associated with the trigger', async () => {
      const menuHandle = Menu.createHandle<number>();
      await render(
        <div>
          <Menu.Trigger handle={menuHandle} id="trigger1" payload={1}>
            Trigger 1
          </Menu.Trigger>
          <Menu.Trigger handle={menuHandle} id="trigger2" payload={2}>
            Trigger 2
          </Menu.Trigger>
          <Menu.Root handle={menuHandle}>
            {({ payload }: NumberPayload) => (
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="content">{payload}</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            )}
          </Menu.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByRole('menu')).to.equal(null);

      await act(async () => {
        menuHandle.open('trigger2');
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('2');
      expect(trigger2).to.have.attribute('aria-expanded', 'true');
      expect(trigger1).not.to.have.attribute('aria-expanded', 'true');

      await act(async () => {
        menuHandle.close();
      });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      expect(trigger2).to.have.attribute('aria-expanded', 'false');
    });
  });
});
