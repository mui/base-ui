import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { fireEvent, screen, flushMicrotasks, act, within } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
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

  describe('prop: defaultOpen', () => {
    it('respects defaultOpen', async () => {
      await render(<TestNavigationMenu defaultValue="item-1" defaultOpen />);
      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
    });
  });

  describe('prop: onOpenChange', () => {
    it('calls onOpenChange when opened/closed', async () => {
      const onOpenChange = spy();
      await render(<TestNavigationMenu onOpenChange={onOpenChange} />);
      const trigger = screen.getByTestId('trigger-1');

      fireEvent.click(trigger);
      await flushMicrotasks();
      expect(onOpenChange.callCount).to.equal(1);
      expect(onOpenChange.lastCall.args[0]).to.equal(true);

      fireEvent.click(trigger);
      await flushMicrotasks();
      expect(onOpenChange.callCount).to.equal(2);
      expect(onOpenChange.lastCall.args[0]).to.equal(false);
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

      await user.tab();
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

  describe('nested menus', () => {
    it('opens nested menu on hover and stays open when hovering over nested popup', async () => {
      await render(<TestNestedNavigationMenu />);
      const trigger1 = screen.getByTestId('trigger-1');

      // Open the first level menu
      fireEvent.mouseEnter(trigger1);
      fireEvent.mouseMove(trigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const popup1 = screen.getByTestId('popup-1');
      expect(popup1).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');

      // Search for the nested trigger *within* the first popup
      const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');

      // Hover over the nested trigger to open the second level menu
      fireEvent.mouseEnter(nestedTrigger1);
      fireEvent.mouseMove(nestedTrigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const nestedPopup1 = screen.getByTestId('nested-popup-1');
      expect(nestedPopup1).not.to.equal(null);
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');

      // Hover over the nested popup
      fireEvent.mouseEnter(nestedPopup1);
      fireEvent.mouseMove(nestedPopup1);
      await flushMicrotasks();

      // Both menus should remain open
      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(screen.queryByTestId('nested-popup-1')).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');
    });

    describe('tabbing', () => {
      it('moves focus through a nested menu correctly', async () => {
        const { user } = await render(
          <div>
            <button data-testid="first" />
            <TestNestedNavigationMenu />
            <button data-testid="last" />
          </div>,
        );

        const trigger1 = screen.getByTestId('trigger-1');

        await act(async () => trigger1.focus());

        fireEvent.click(trigger1);
        await flushMicrotasks();

        const popup1 = screen.getByTestId('popup-1');
        expect(popup1).not.to.equal(null);
        expect(trigger1).toHaveFocus();

        await user.tab();
        expect(screen.getByText('Link 1')).toHaveFocus();

        await user.tab();
        const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');
        expect(nestedTrigger1).toHaveFocus();

        fireEvent.click(nestedTrigger1);
        await flushMicrotasks();

        expect(screen.getByTestId('nested-popup-1')).not.to.equal(null);

        expect(nestedTrigger1).toHaveFocus();

        await user.tab();
        expect(screen.getByText('Nested Link 1')).toHaveFocus();

        await user.tab({ shift: true });
        expect(nestedTrigger1).toHaveFocus();

        await user.tab({ shift: true });
        expect(screen.getByText('Link 1')).toHaveFocus();

        await user.tab({ shift: true });
        expect(trigger1).toHaveFocus();
      });
    });
  });
});
