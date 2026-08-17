import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { ContextMenu } from '@base-ui/react/context-menu';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<ContextMenu.Trigger />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

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

  it('throws when rendered outside ContextMenu.Root', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<ContextMenu.Trigger />)).rejects.toThrow(
        'Base UI: ContextMenuRootContext is missing. ContextMenu parts must be placed within <ContextMenu.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

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

    expect(screen.queryByRole('menu')).not.toBe(null);
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
    expect(trigger).toHaveAttribute('data-popup-open', '');

    await user.keyboard('{Escape}');
    expect(trigger).not.toHaveAttribute('data-popup-open');
  });

  it('should call onOpenChange when menu is opened via right click', async () => {
    const onOpenChange = vi.fn();

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

    expect(onOpenChange.mock.lastCall?.[0]).toBe(true);
  });

  it('does not cancel opening menu on mouseup after mousedown outside before 500ms', async () => {
    const onOpenChange = vi.fn();

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

    expect(onOpenChange.mock.calls.length).toBe(1);
    expect(onOpenChange.mock.lastCall?.[0]).toBe(true);

    fireEvent.mouseUp(document.body);

    clock.tick(1);

    expect(onOpenChange.mock.calls.length).toBe(1);
  });

  it('cancels opening menu on mouseup after mousedown outside after 500ms', async () => {
    const onOpenChange = vi.fn();

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

    expect(onOpenChange.mock.calls.length).toBe(2);
    expect(onOpenChange.mock.lastCall?.[0]).toBe(false);
  });

  it('keeps the menu open when the context-menu gesture ends inside its positioner', async () => {
    const onOpenChange = vi.fn();

    await render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner data-testid="positioner">
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    clock.tick(501);
    fireEvent.mouseUp(screen.getByTestId('positioner'));

    expect(onOpenChange.mock.calls).toHaveLength(1);
    expect(screen.queryByRole('menu')).not.toBe(null);
  });

  it('keeps the root menu open when the context-menu gesture ends in a portaled submenu', async () => {
    const onOpenChange = vi.fn();

    await render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner>
            <ContextMenu.Popup>
              <ContextMenu.SubmenuRoot defaultOpen>
                <ContextMenu.SubmenuTrigger>More</ContextMenu.SubmenuTrigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner>
                    <ContextMenu.Popup data-testid="submenu-popup" />
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.SubmenuRoot>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    clock.tick(501);
    fireEvent.mouseUp(screen.getByTestId('submenu-popup'));

    expect(onOpenChange.mock.calls).toHaveLength(1);
    expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
  });

  it('aborts the pending document mouseup listener when the trigger unmounts', async () => {
    const onOpenChange = vi.fn();
    let hideTrigger = () => {};

    function Test() {
      const [showTrigger, setShowTrigger] = React.useState(true);
      hideTrigger = () => setShowTrigger(false);

      return (
        <ContextMenu.Root onOpenChange={onOpenChange}>
          {showTrigger && (
            <ContextMenu.Trigger data-testid="trigger">Right click me</ContextMenu.Trigger>
          )}
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup />
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      );
    }

    await render(<Test />);
    fireEvent.contextMenu(screen.getByTestId('trigger'));

    await act(async () => {
      hideTrigger();
    });

    clock.tick(501);
    fireEvent.mouseUp(document.body);

    expect(onOpenChange.mock.calls).toHaveLength(1);
    expect(screen.queryByRole('menu')).not.toBe(null);
  });

  describe('prop: disabled', () => {
    it('does not open on right-click when disabled', async () => {
      const onOpenChange = vi.fn();

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

      expect(screen.queryByTestId('popup')).toBe(null);
      expect(onOpenChange.mock.calls.length).toBe(0);
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

      expect(defaultPrevented).toBe(false);
    });
  });

  it('blocks native context menus on both internal and external backdrops', async () => {
    await render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Right click me</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Backdrop data-testid="backdrop" />
          <ContextMenu.Positioner>
            <ContextMenu.Popup />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    await flushMicrotasks();

    const internalBackdrop = document.querySelector(
      '[data-base-ui-portal] > [data-base-ui-inert][role="presentation"]',
    )!;
    const externalBackdrop = screen.getByTestId('backdrop');
    const internalEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const externalEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const outsideEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

    internalBackdrop.dispatchEvent(internalEvent);
    externalBackdrop.dispatchEvent(externalEvent);
    document.body.dispatchEvent(outsideEvent);

    expect(internalEvent.defaultPrevented).toBe(true);
    expect(externalEvent.defaultPrevented).toBe(true);
    expect(outsideEvent.defaultPrevented).toBe(false);
  });

  it('blocks native context menus in a portal mounted inside the trigger DOM subtree', async () => {
    const portalContainerRef = React.createRef<HTMLDivElement>();

    await render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>
          Right click me
          <div ref={portalContainerRef} />
        </ContextMenu.Trigger>
        <ContextMenu.Portal container={portalContainerRef}>
          <ContextMenu.Positioner>
            <ContextMenu.Popup data-testid="popup" />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    screen.getByTestId('popup').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('blocks the native context menu when onContextMenu skips the Base UI handler', async () => {
    await render(
      <ContextMenu.Root>
        <ContextMenu.Trigger
          data-testid="trigger"
          onContextMenu={(event) => event.preventBaseUIHandler()}
        >
          Right click me
        </ContextMenu.Trigger>
      </ContextMenu.Root>,
    );

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    screen.getByTestId('trigger').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
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

      expect(screen.queryByRole('menu')).not.toBe(null);
    });

    it('should cancel long press when touch moves beyond threshold', async () => {
      const onOpenChange = vi.fn();

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

      expect(screen.queryByRole('menu')).toBe(null);
      expect(onOpenChange.mock.calls.length).toBe(0);
    });

    it('keeps a pending long press when touch movement stays within the threshold', async () => {
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
      fireEvent.touchStart(trigger, {
        touches: [new Touch({ identifier: 0, target: trigger, clientX: 100, clientY: 100 })],
      });
      fireEvent.touchMove(trigger, {
        touches: [new Touch({ identifier: 0, target: trigger, clientX: 105, clientY: 105 })],
      });

      clock.tick(500);

      expect(screen.queryByRole('menu')).not.toBe(null);
    });

    it('cancels a pending long press when the touch ends', async () => {
      const onOpenChange = vi.fn();

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
      fireEvent.touchStart(trigger, {
        touches: [new Touch({ identifier: 0, target: trigger, clientX: 100, clientY: 100 })],
      });
      fireEvent.touchEnd(trigger);
      clock.tick(500);

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).toBe(null);
    });

    it('cancels a pending long press when the gesture becomes multi-touch', async () => {
      const onOpenChange = vi.fn();

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
      const firstTouch = new Touch({ identifier: 0, target: trigger, clientX: 100, clientY: 100 });
      const touches = [
        firstTouch,
        new Touch({ identifier: 1, target: trigger, clientX: 120, clientY: 100 }),
      ];

      fireEvent.touchStart(trigger, { touches: [firstTouch] });
      fireEvent.touchMove(trigger, { touches });
      fireEvent.touchMove(trigger, { touches: [firstTouch] });
      clock.tick(500);

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).toBe(null);

      fireEvent.touchEnd(trigger);
      fireEvent.touchStart(trigger, { touches: [firstTouch] });
      fireEvent.touchStart(trigger, { touches });
      clock.tick(500);

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).toBe(null);
    });

    it('delays outside-press dismissal after opening from a long press', async () => {
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
      fireEvent.touchStart(trigger, {
        touches: [new Touch({ identifier: 0, target: trigger, clientX: 100, clientY: 100 })],
      });
      clock.tick(500);

      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('menu')).not.toBe(null);

      clock.tick(500);
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('menu')).toBe(null);
    });

    it('does not open on long press when disabled', async () => {
      const onOpenChange = vi.fn();

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

      expect(screen.queryByTestId('popup')).toBe(null);
      expect(onOpenChange.mock.calls.length).toBe(0);
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

    expect(screen.queryByTestId('inner-menu')).not.toBe(null);
    expect(screen.queryByTestId('outer-menu')).toBe(null);

    fireEvent.pointerDown(document.body, { pointerType: 'mouse' });
    await flushMicrotasks();

    expect(screen.queryByTestId('inner-menu')).toBe(null);

    fireEvent.contextMenu(outerTrigger);
    await flushMicrotasks();

    expect(screen.queryByTestId('outer-menu')).not.toBe(null);
    expect(screen.queryByTestId('inner-menu')).toBe(null);
  });
});
