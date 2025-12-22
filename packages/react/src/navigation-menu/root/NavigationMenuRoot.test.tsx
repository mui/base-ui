import { expect } from 'chai';
import { spy } from 'sinon';
import { fireEvent, screen, flushMicrotasks, act, within, waitFor } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, describeConformance } from '#test-utils';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { OPEN_DELAY } from '../utils/constants';

function TestNavigationMenu(props: NavigationMenu.Root.Props) {
  return (
    <NavigationMenu.Root {...props}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
            <NavigationMenu.Link href="#link-2">Link 2</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="item-2">
          <NavigationMenu.Trigger data-testid="trigger-2">Item 2</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="popup-2">
            <NavigationMenu.Link href="#link-3">Link 3</NavigationMenu.Link>
            <NavigationMenu.Link href="#link-4">Link 4</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function TestNestedNavigationMenu() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
            <NavigationMenu.Root>
              <NavigationMenu.List>
                <NavigationMenu.Item value="nested-item-1">
                  <NavigationMenu.Trigger data-testid="nested-trigger-1">
                    Nested Item 1
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="nested-popup-1">
                    <NavigationMenu.Link href="#nested-link-1">Nested Link 1</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>

              <NavigationMenu.Portal>
                <NavigationMenu.Positioner side="right">
                  <NavigationMenu.Popup>
                    <NavigationMenu.Viewport />
                  </NavigationMenu.Popup>
                </NavigationMenu.Positioner>
              </NavigationMenu.Portal>
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="item-2">
          <NavigationMenu.Trigger data-testid="trigger-2">Item 2</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="popup-2">
            <NavigationMenu.Link href="#link-3">Link 3</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function TestInlineNestedNavigationMenu() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
            <NavigationMenu.Root defaultValue="nested-item-1">
              <NavigationMenu.List>
                <NavigationMenu.Item value="nested-item-1">
                  <NavigationMenu.Trigger data-testid="nested-trigger-1">
                    Nested Item 1
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="nested-popup-1">
                    <NavigationMenu.Link href="#nested-link-1">Nested Link 1</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
                <NavigationMenu.Item value="nested-item-2">
                  <NavigationMenu.Trigger data-testid="nested-trigger-2">
                    Nested Item 2
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="nested-popup-2">
                    <NavigationMenu.Link href="#nested-link-2">Nested Link 2</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>

              <NavigationMenu.Viewport />
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="item-2">
          <NavigationMenu.Trigger data-testid="trigger-2">Item 2</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="popup-2">
            <NavigationMenu.Link href="#link-3">Link 3</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function TestDeeplyNestedNavigationMenu() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="content-1">
            <NavigationMenu.Link href="#link-1" data-testid="link-1">
              Link 1
            </NavigationMenu.Link>
            {/* Level 2 */}
            <NavigationMenu.Root defaultValue="level2-item-1">
              <NavigationMenu.List>
                <NavigationMenu.Item value="level2-item-1">
                  <NavigationMenu.Trigger data-testid="level2-trigger-1">
                    Level 2 Item 1
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="level2-content-1">
                    <NavigationMenu.Link href="#level2-link-1" data-testid="level2-link-1">
                      Level 2 Link 1
                    </NavigationMenu.Link>
                    {/* Level 3 */}
                    <NavigationMenu.Root defaultValue="level3-item-1">
                      <NavigationMenu.List>
                        <NavigationMenu.Item value="level3-item-1">
                          <NavigationMenu.Trigger data-testid="level3-trigger-1">
                            Level 3 Item 1
                          </NavigationMenu.Trigger>
                          <NavigationMenu.Content data-testid="level3-content-1">
                            <NavigationMenu.Link href="#level3-link-1">
                              Level 3 Link 1
                            </NavigationMenu.Link>
                          </NavigationMenu.Content>
                        </NavigationMenu.Item>
                        <NavigationMenu.Item value="level3-item-2">
                          <NavigationMenu.Trigger data-testid="level3-trigger-2">
                            Level 3 Item 2
                          </NavigationMenu.Trigger>
                          <NavigationMenu.Content data-testid="level3-content-2">
                            <NavigationMenu.Link href="#level3-link-2">
                              Level 3 Link 2
                            </NavigationMenu.Link>
                          </NavigationMenu.Content>
                        </NavigationMenu.Item>
                      </NavigationMenu.List>
                      <NavigationMenu.Viewport />
                    </NavigationMenu.Root>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
                <NavigationMenu.Item value="level2-item-2">
                  <NavigationMenu.Trigger data-testid="level2-trigger-2">
                    Level 2 Item 2
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="level2-content-2">
                    <NavigationMenu.Link href="#level2-link-2">Level 2 Link 2</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>
              <NavigationMenu.Viewport />
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function TestNavigationMenuWithDialog() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="popup-1">
            <Dialog.Root>
              <Dialog.Trigger data-testid="dialog-trigger">Open dialog</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup
                  data-testid="dialog-popup"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <button type="button" data-testid="dialog-button">
                    Dialog button
                  </button>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function TestNavigationMenuWithPopover() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="popup-1">
            <Popover.Root>
              <Popover.Trigger data-testid="popover-trigger">Open popover</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup
                    data-testid="popover-popup"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <button type="button" data-testid="popover-button">
                      Popover button
                    </button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

describe('<NavigationMenu.Root />', () => {
  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  clock.withFakeTimers();

  describeConformance(<NavigationMenu.Root />, () => ({
    refInstanceof: window.HTMLElement,
    render(node) {
      return render(node);
    },
  }));

  describe('interactions', () => {
    it('opens on hover with mouse input', async () => {
      await render(<TestNavigationMenu />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      clock.tick(50);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger).to.have.attribute('aria-expanded', 'true');
    });

    it('opens on click with mouse input', async () => {
      await render(<TestNavigationMenu />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger).to.have.attribute('aria-expanded', 'true');
    });

    it('does not open on hover with touch input', async () => {
      await render(<TestNavigationMenu />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);
      expect(trigger).to.have.attribute('aria-expanded', 'false');
    });

    it('opens on click with touch input', async () => {
      await render(<TestNavigationMenu />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.pointerDown(trigger, { pointerType: 'touch' });
      fireEvent.pointerUp(trigger, { pointerType: 'touch' });
      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger).to.have.attribute('aria-expanded', 'true');
    });

    it('does not close menu when clicking a different trigger with mouse', async () => {
      await render(<TestNavigationMenu />);
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');

      fireEvent.click(trigger2);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByTestId('popup-2')).not.to.equal(null);
      expect(trigger2).to.have.attribute('aria-expanded', 'true');
    });

    it('does not close menu when clicking a different trigger on touch', async () => {
      await render(<TestNavigationMenu />);
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');

      fireEvent.pointerDown(trigger2, { pointerType: 'touch' });
      fireEvent.pointerUp(trigger2, { pointerType: 'touch' });
      fireEvent.click(trigger2);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByTestId('popup-2')).not.to.equal(null);
      expect(trigger2).to.have.attribute('aria-expanded', 'true');
    });

    it('returns focus to trigger when closing menu', async () => {
      const { user } = await render(
        <div>
          <button data-testid="first" />
          <TestNavigationMenu />
          <button data-testid="last" />
        </div>,
      );

      const trigger = screen.getByTestId('trigger-1');

      await user.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger).toHaveFocus();

      await user.keyboard('{Escape}');
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);
      expect(trigger).toHaveFocus();
    });

    it('respects focus outside when clicking menu', async () => {
      const { user } = await render(
        <div>
          <button data-testid="first" />
          <TestNavigationMenu />
          <button data-testid="last" />
        </div>,
      );

      const trigger = screen.getByTestId('trigger-1');
      const last = screen.getByTestId('last');

      await user.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger).toHaveFocus();

      await user.click(screen.getByTestId('last'));
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);
      expect(last).toHaveFocus();
    });

    it('does not restore focus to the trigger when closed via hover', async () => {
      await render(<TestNavigationMenu />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      clock.tick(OPEN_DELAY);

      const popup = await screen.findByTestId('popup-1');
      expect(trigger).to.have.attribute('aria-expanded', 'true');

      fireEvent.mouseLeave(trigger);
      fireEvent.mouseLeave(popup);
      clock.tick(50);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).to.equal(null);
      });
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).not.toHaveFocus();
    });

    it('does not restore focus to the trigger when focus moves outside', async () => {
      const { user } = await render(
        <div>
          <button data-testid="first" />
          <TestNavigationMenu />
          <button data-testid="last" />
        </div>,
      );

      const trigger = screen.getByTestId('trigger-1');
      const last = screen.getByTestId('last');

      await act(async () => trigger.focus());

      await user.click(trigger);
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).to.equal(null);
      });
      expect(last).toHaveFocus();
      expect(trigger).not.toHaveFocus();
    });
  });

  describe('patient click threshold', () => {
    it('closes if hovered then clicked after the patient threshold', async () => {
      await render(<TestNavigationMenu />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.click(trigger);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);
      expect(trigger).to.have.attribute('aria-expanded', 'false');
    });
  });

  describe('prop: defaultValue', () => {
    it('should respect defaultValue', async () => {
      await render(<TestNavigationMenu defaultValue="item-1" />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();
      expect(trigger).to.have.attribute('aria-expanded', 'true');
    });
  });

  describe('prop: onValueChange', () => {
    it('should call onValueChange when value changes', async () => {
      const onValueChange = spy();
      await render(<TestNavigationMenu onValueChange={onValueChange} />);
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      fireEvent.click(trigger1);
      await flushMicrotasks();
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.lastCall.args[0]).to.equal('item-1');

      fireEvent.click(trigger2);
      await flushMicrotasks();
      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.lastCall.args[0]).to.equal('item-2');
    });

    it('should be controlled by value prop', async () => {
      const { setProps } = await render(<TestNavigationMenu value="item-1" />);

      let trigger1 = screen.getByTestId('trigger-1');
      fireEvent.mouseEnter(trigger1);
      fireEvent.mouseMove(trigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();
      expect(trigger1).to.have.attribute('aria-expanded', 'true');

      await setProps({ value: 'item-2' });

      const trigger2 = screen.getByTestId('trigger-2');
      fireEvent.mouseLeave(trigger1);
      fireEvent.mouseEnter(trigger2);
      fireEvent.mouseMove(trigger2);
      await flushMicrotasks();

      trigger1 = screen.getByTestId('trigger-1');
      expect(trigger1).to.have.attribute('aria-expanded', 'false');
      expect(trigger2).to.have.attribute('aria-expanded', 'true');
    });
  });

  describe('prop: delay', () => {
    it('respects custom delay value', async () => {
      const customDelay = 100;
      await render(<TestNavigationMenu delay={customDelay} />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      clock.tick(customDelay - 25);
      await flushMicrotasks();

      // Menu shouldn't be open yet since we're before the delay
      expect(screen.queryByTestId('popup-1')).to.equal(null);

      clock.tick(50);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger).to.have.attribute('aria-expanded', 'true');
    });
  });

  describe('prop: closeDelay', () => {
    it('respects custom closeDelay value', async () => {
      const customCloseDelay = 100;
      await render(<TestNavigationMenu closeDelay={customCloseDelay} />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();
      expect(screen.queryByTestId('popup-1')).not.to.equal(null);

      fireEvent.mouseLeave(trigger);
      clock.tick(customCloseDelay - 25);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);

      // Complete the closeDelay
      clock.tick(50);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);
      expect(trigger).to.have.attribute('aria-expanded', 'false');
    });
  });

  describe('tabbing', () => {
    it('moves focus through the menu correctly', async () => {
      const { user } = await render(
        <div>
          <button data-testid="first" />
          <TestNavigationMenu />
        </div>,
      );
      const trigger1 = screen.getByTestId('trigger-1');

      await act(async () => trigger1.focus());

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(screen.getByTestId('popup-1')).not.to.equal(null);
      expect(trigger1).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Link 1')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Link 2')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('trigger-2')).toHaveFocus();

      fireEvent.click(screen.getByTestId('trigger-2'));
      await flushMicrotasks();

      expect(screen.getByTestId('popup-2')).not.to.equal(null);

      await user.tab();
      expect(screen.getByText('Link 3')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Link 4')).toHaveFocus();

      await user.tab({ shift: true });
      await user.tab({ shift: true });
      await user.tab({ shift: true });

      expect(trigger1).toHaveFocus();
    });

    it('closes the menu when tabbing forward out', async () => {
      const { user } = await render(
        <div>
          <button data-testid="first" />
          <TestNavigationMenu />
          <button data-testid="last" />
        </div>,
      );
      const trigger = screen.getByTestId('trigger-1');

      await act(async () => trigger.focus());
      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.getByTestId('popup-1')).not.to.equal(null);
      expect(trigger).toHaveFocus();

      await user.tab(); // Link 1
      await user.tab(); // Link 2
      await user.tab(); // trigger 2
      await user.tab(); // last

      expect(screen.queryByTestId('popup-1')).to.equal(null);
    });

    it('closes the menu when tabbing back out', async () => {
      const { user } = await render(
        <div>
          <button data-testid="first" />
          <TestNavigationMenu />
        </div>,
      );
      const trigger = screen.getByTestId('trigger-1');

      await act(async () => trigger.focus());
      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.getByTestId('popup-1')).not.to.equal(null);
      expect(trigger).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Link 1')).toHaveFocus();

      await user.tab({ shift: true }); // trigger 1
      await user.tab({ shift: true }); // first

      expect(screen.queryByTestId('popup-1')).to.equal(null);
    });
  });

  describe('nested popups', () => {
    it('keeps the menu open when interacting with a nested dialog', async () => {
      const { user } = await render(<TestNavigationMenuWithDialog />);
      const trigger = screen.getByTestId('trigger-1');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      });
      expect(trigger).to.have.attribute('aria-expanded', 'true');

      const dialogTrigger = screen.getByTestId('dialog-trigger');
      await user.click(dialogTrigger);

      expect(await screen.findByTestId('dialog-popup')).not.to.equal(null);

      await user.click(screen.getByTestId('dialog-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      });
      expect(trigger).to.have.attribute('aria-expanded', 'true');
    });

    it('keeps the menu open when interacting with a nested popover', async () => {
      const { user } = await render(<TestNavigationMenuWithPopover />);
      const trigger = screen.getByTestId('trigger-1');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      });
      expect(trigger).to.have.attribute('aria-expanded', 'true');

      const popoverTrigger = screen.getByTestId('popover-trigger');
      await user.click(popoverTrigger);

      expect(await screen.findByTestId('popover-popup')).not.to.equal(null);

      await user.click(screen.getByTestId('popover-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      });
      expect(trigger).to.have.attribute('aria-expanded', 'true');
    });
  });

  describe('nested menus', () => {
    it('opens nested menu on hover and stays open when hovering over nested popup', async () => {
      await render(<TestNestedNavigationMenu />);
      const trigger1 = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger1);
      fireEvent.mouseMove(trigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const popup1 = screen.getByTestId('popup-1');
      expect(popup1).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');

      const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');

      fireEvent.mouseEnter(nestedTrigger1);
      fireEvent.mouseMove(nestedTrigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const nestedPopup1 = screen.getByTestId('nested-popup-1');
      expect(nestedPopup1).not.to.equal(null);
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');

      fireEvent.mouseEnter(nestedPopup1);
      fireEvent.mouseMove(nestedPopup1);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(screen.queryByTestId('nested-popup-1')).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');
    });

    it('handles inline nested menu without positioner/popup correctly', async () => {
      await render(<TestInlineNestedNavigationMenu />);
      const trigger1 = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger1);
      fireEvent.mouseMove(trigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const popup1 = screen.getByTestId('popup-1');
      expect(popup1).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');

      const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');

      fireEvent.mouseEnter(nestedTrigger1);
      fireEvent.mouseMove(nestedTrigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const nestedPopup1 = screen.getByTestId('nested-popup-1');
      expect(nestedPopup1).not.to.equal(null);
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');

      fireEvent.mouseEnter(nestedPopup1);
      fireEvent.mouseMove(nestedPopup1);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(screen.queryByTestId('nested-popup-1')).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');

      const nestedTrigger2 = within(popup1).getByTestId('nested-trigger-2');
      fireEvent.mouseEnter(nestedTrigger2);
      fireEvent.mouseMove(nestedTrigger2);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const nestedPopup2 = screen.getByTestId('nested-popup-2');
      expect(nestedPopup2).not.to.equal(null);
      expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'false');
    });

    describe('inline nested viewport', () => {
      it('renders viewport content correctly for inline nested menu', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.mouseEnter(trigger1);
        fireEvent.mouseMove(trigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        const popup1 = screen.getByTestId('popup-1');
        expect(popup1).not.to.equal(null);

        const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');
        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');

        const nestedPopup1 = screen.getByTestId('nested-popup-1');
        expect(nestedPopup1).not.to.equal(null);
        expect(screen.getByText('Nested Link 1')).not.to.equal(null);
      });

      it('switches content in viewport when hovering different nested triggers', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.mouseEnter(trigger1);
        fireEvent.mouseMove(trigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        const popup1 = screen.getByTestId('popup-1');
        const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');
        const nestedTrigger2 = within(popup1).getByTestId('nested-trigger-2');

        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');
        expect(screen.getByTestId('nested-popup-1')).not.to.equal(null);

        fireEvent.mouseEnter(nestedTrigger2);
        fireEvent.mouseMove(nestedTrigger2);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'false');
        expect(screen.getByTestId('nested-popup-2')).not.to.equal(null);
        expect(screen.queryByTestId('nested-popup-1')).to.equal(null);

        fireEvent.mouseEnter(nestedTrigger1);
        fireEvent.mouseMove(nestedTrigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');
        expect(nestedTrigger2).to.have.attribute('aria-expanded', 'false');
        expect(screen.getByTestId('nested-popup-1')).not.to.equal(null);
        expect(screen.queryByTestId('nested-popup-2')).to.equal(null);
      });

      it('closes inline nested viewport when parent menu closes', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.mouseEnter(trigger1);
        fireEvent.mouseMove(trigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        const popup1 = screen.getByTestId('popup-1');
        expect(popup1).not.to.equal(null);

        const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');
        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');
        expect(screen.getByTestId('nested-popup-1')).not.to.equal(null);

        fireEvent.mouseLeave(trigger1);
        fireEvent.mouseLeave(popup1);
        clock.tick(50); // closeDelay
        await flushMicrotasks();

        expect(screen.queryByTestId('popup-1')).to.equal(null);
        expect(screen.queryByTestId('nested-popup-1')).to.equal(null);
        expect(trigger1).to.have.attribute('aria-expanded', 'false');
      });

      it('maintains inline viewport state when hovering between triggers and content', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.mouseEnter(trigger1);
        fireEvent.mouseMove(trigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        const popup1 = screen.getByTestId('popup-1');

        const nestedTrigger2 = within(popup1).getByTestId('nested-trigger-2');
        fireEvent.mouseEnter(nestedTrigger2);
        fireEvent.mouseMove(nestedTrigger2);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
        const nestedPopup2 = screen.getByTestId('nested-popup-2');
        expect(nestedPopup2).not.to.equal(null);

        fireEvent.mouseEnter(nestedPopup2);
        fireEvent.mouseMove(nestedPopup2);
        await flushMicrotasks();

        expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
        expect(screen.getByTestId('nested-popup-2')).not.to.equal(null);

        fireEvent.mouseEnter(nestedTrigger2);
        fireEvent.mouseMove(nestedTrigger2);
        await flushMicrotasks();

        expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
        expect(screen.getByTestId('nested-popup-2')).not.to.equal(null);
      });

      it('handles click interactions on inline nested menu triggers', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.click(trigger1);
        await flushMicrotasks();

        const popup1 = screen.getByTestId('popup-1');
        expect(popup1).not.to.equal(null);

        const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');
        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');

        const nestedTrigger2 = within(popup1).getByTestId('nested-trigger-2');
        fireEvent.click(nestedTrigger2);
        await flushMicrotasks();

        expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'false');
        expect(screen.getByTestId('nested-popup-2')).not.to.equal(null);
        expect(screen.queryByTestId('nested-popup-1')).to.equal(null);

        fireEvent.click(nestedTrigger2);
        await flushMicrotasks();

        expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'false');
        expect(screen.queryByTestId('nested-popup-2')).not.to.equal(null);
        expect(screen.queryByTestId('nested-popup-1')).to.equal(null);
      });

      it('allows arrow key navigation to submenu triggers', async () => {
        const { user } = await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.click(trigger1);
        await flushMicrotasks();

        const popup1 = screen.getByTestId('popup-1');
        expect(popup1).not.to.equal(null);

        const link1 = screen.getByText('Link 1');
        await act(async () => link1.focus());

        // Arrow down should move to nested-trigger-1
        await user.keyboard('{ArrowDown}');

        const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');
        expect(nestedTrigger1).toHaveFocus();

        // Arrow down should move to nested-trigger-2
        await user.keyboard('{ArrowDown}');

        const nestedTrigger2 = within(popup1).getByTestId('nested-trigger-2');
        expect(nestedTrigger2).toHaveFocus();

        // Arrow up should move back to nested-trigger-1
        await user.keyboard('{ArrowUp}');
        expect(nestedTrigger1).toHaveFocus();

        // Arrow up should move back to Link 1
        await user.keyboard('{ArrowUp}');
        expect(link1).toHaveFocus();
      });

      it('allows arrow key navigation with 3+ levels of nesting', async () => {
        const { user } = await render(<TestDeeplyNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.click(trigger1);
        await flushMicrotasks();

        const content1 = screen.getByTestId('content-1');
        expect(content1).not.to.equal(null);

        // Level 1 content contains: Link 1, Level2-trigger-1, Level2-trigger-2
        const link1 = screen.getByTestId('link-1');
        await act(async () => link1.focus());

        // Navigate through Level 1 content items
        await user.keyboard('{ArrowDown}');
        const level2Trigger1 = screen.getByTestId('level2-trigger-1');
        expect(level2Trigger1).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        const level2Trigger2 = screen.getByTestId('level2-trigger-2');
        expect(level2Trigger2).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(level2Trigger1).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(link1).toHaveFocus();

        // Now navigate into Level 2 content (which contains Level 3 triggers)
        const level2Content1 = screen.getByTestId('level2-content-1');
        const level2Link1 = within(level2Content1).getByTestId('level2-link-1');
        await act(async () => level2Link1.focus());

        // Navigate through Level 2 content items (includes Level 3 triggers)
        await user.keyboard('{ArrowDown}');
        const level3Trigger1 = screen.getByTestId('level3-trigger-1');
        expect(level3Trigger1).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        const level3Trigger2 = screen.getByTestId('level3-trigger-2');
        expect(level3Trigger2).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(level3Trigger1).toHaveFocus();

        await user.keyboard('{ArrowUp}');
        expect(level2Link1).toHaveFocus();
      });
    });
  });
});
