import { expect } from 'chai';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { ContextMenu } from '@base-ui/react/context-menu';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<ContextMenu.Trigger />', () => {
  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  clock.withFakeTimers();

  describeConformance(<ContextMenu.Trigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ContextMenu.Root>{node}</ContextMenu.Root>);
    },
  }));

  it('should open menu on right click (context menu event)', async () => {
    await render(
      <ContextMenu.Root>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.contextMenu(trigger);
    await flushMicrotasks();

    expect(screen.queryByRole('menu')).not.to.equal(null);
  });

  it('adds open state attributes', async () => {
    const { user } = await render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    expect(trigger).to.have.attribute('data-popup-open', '');

    await user.keyboard('{Escape}');
    expect(trigger).to.not.have.attribute('data-popup-open');
  });

  it('should call onOpenChange when menu is opened via right click', async () => {
    const onOpenChange = spy();

    await render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.contextMenu(trigger);
    await flushMicrotasks();

    expect(onOpenChange.lastCall.args[0]).to.equal(true);
  });

  it('does not cancel opening menu on mouseup after mousedown outside before 500ms', async () => {
    const onOpenChange = spy();

    await render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.mouseDown(trigger);
    fireEvent.contextMenu(trigger);

    clock.tick(499);

    expect(onOpenChange.callCount).to.equal(1);
    expect(onOpenChange.lastCall.args[0]).to.equal(true);

    fireEvent.mouseUp(document.body);

    clock.tick(1);

    expect(onOpenChange.callCount).to.equal(1);
  });

  it('cancels opening menu on mouseup after mousedown outside after 500ms', async () => {
    const onOpenChange = spy();

    await render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.mouseDown(trigger);
    fireEvent.contextMenu(trigger);

    clock.tick(501);

    fireEvent.mouseUp(document.body);

    expect(onOpenChange.callCount).to.equal(2);
    expect(onOpenChange.lastCall.args[0]).to.equal(false);
  });

  describe('prop: disabled', () => {
    it('does not open on right-click when disabled', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root disabled onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="popup" />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.contextMenu(trigger);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup')).to.equal(null);
      expect(onOpenChange.callCount).to.equal(0);
    });

    it('does not block the native context menu when disabled', async () => {
      await render(
        <ContextMenu.Root disabled>
          <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="popup" />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      let defaultPrevented = false;
      trigger.addEventListener(
        'contextmenu',
        (event) => {
          defaultPrevented = event.defaultPrevented;
        },
        { capture: false },
      );

      fireEvent.contextMenu(trigger);
      await flushMicrotasks();

      expect(defaultPrevented).to.equal(false);
    });
  });

  describe.skipIf(isJSDOM)('long press', () => {
    it('should open menu on long press on touchscreen devices', async () => {
      await render(
        <ContextMenu.Root>
          <ContextMenu.Trigger data-testid="trigger">Long press me</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      const touchObj = new Touch({
        identifier: 0,
        target: trigger,
        clientX: 100,
        clientY: 100,
      });

      fireEvent.touchStart(trigger, {
        touches: [touchObj],
      });

      clock.tick(500);

      expect(screen.queryByRole('menu')).not.to.equal(null);
    });

    it('should cancel long press when touch moves beyond threshold', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="trigger">Long press me</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      const touchStartObj = new Touch({
        identifier: 0,
        target: trigger,
        clientX: 100,
        clientY: 100,
      });

      fireEvent.touchStart(trigger, {
        touches: [touchStartObj],
      });

      // Simulate touch move (more than 10px movement)
      // This should cancel the long press
      const touchMoveObj = new Touch({
        identifier: 0,
        target: trigger,
        clientX: 120,
        clientY: 100,
      });

      fireEvent.touchMove(trigger, {
        touches: [touchMoveObj],
      });

      clock.tick(500);

      expect(screen.queryByRole('menu')).to.equal(null);
      expect(onOpenChange.callCount).to.equal(0);
    });

    it('does not open on long press when disabled', async () => {
      const onOpenChange = spy();

      await render(
        <ContextMenu.Root disabled onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="trigger">Long press me</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup data-testid="popup" />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      const touchObj = new Touch({
        identifier: 0,
        target: trigger,
        clientX: 100,
        clientY: 100,
      });

      fireEvent.touchStart(trigger, {
        touches: [touchObj],
      });

      clock.tick(500);

      expect(screen.queryByTestId('popup')).to.equal(null);
      expect(onOpenChange.callCount).to.equal(0);
    });
  });

  it('should handle nested context menus correctly', async () => {
    await render(
      <ContextMenu.Root>
        <ContextMenu.Trigger data-testid="outer-trigger">
          outer
          <ContextMenu.Root>
            <ContextMenu.Trigger>inner</ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Positioner>
                <ContextMenu.Popup data-testid="inner-menu" />
              </ContextMenu.Positioner>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup data-testid="outer-menu" />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const innerTrigger = screen.getByText('inner');
    const outerTrigger = screen.getByText('outer');

    fireEvent.contextMenu(innerTrigger);
    await flushMicrotasks();

    expect(screen.queryByTestId('inner-menu')).not.to.equal(null);
    expect(screen.queryByTestId('outer-menu')).to.equal(null);

    fireEvent.pointerDown(document.body, { pointerType: 'mouse' });
    await flushMicrotasks();

    expect(screen.queryByTestId('inner-menu')).to.equal(null);

    fireEvent.contextMenu(outerTrigger);
    await flushMicrotasks();

    expect(screen.queryByTestId('outer-menu')).not.to.equal(null);
    expect(screen.queryByTestId('inner-menu')).to.equal(null);
  });
});
