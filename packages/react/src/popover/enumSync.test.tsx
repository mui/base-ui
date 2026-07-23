import * as React from 'react';
import { expect } from 'vitest';
import { Popover } from '@base-ui/react/popover';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { PopoverArrowDataAttributes } from './arrow/PopoverArrowDataAttributes';
import { PopoverBackdropDataAttributes } from './backdrop/PopoverBackdropDataAttributes';
import { PopoverPopupCssVars } from './popup/PopoverPopupCssVars';
import { PopoverPopupDataAttributes } from './popup/PopoverPopupDataAttributes';
import { PopoverPositionerCssVars } from './positioner/PopoverPositionerCssVars';
import { PopoverPositionerDataAttributes } from './positioner/PopoverPositionerDataAttributes';
import { PopoverTriggerDataAttributes } from './trigger/PopoverTriggerDataAttributes';
import { PopoverViewportCssVars } from './viewport/PopoverViewportCssVars';
import { PopoverViewportDataAttributes } from './viewport/PopoverViewportDataAttributes';
import { popupStateMapping } from '../utils/popupStateMapping';
import { transitionStatusMapping } from '../internals/stateAttributesMapping';
import { popupViewportStateMapping } from '../utils/usePopupViewport';

// The parts emit these attribute names as inlined string literals so the enums below stay
// tree-shakeable (they exist for types and docs only). Nothing else links the literals to the
// enums, so re-link every member of every enum in this module here: renaming only one side fails
// CI.
describe('Popover enum sync', () => {
  const { render } = createRenderer();

  async function renderPopover() {
    return render(
      <Popover.Root>
        <Popover.Trigger>Toggle</Popover.Trigger>
        <Popover.Backdrop data-testid="backdrop" />
        <Popover.Portal keepMounted>
          <Popover.Positioner data-testid="positioner">
            <Popover.Popup data-testid="popup">
              <Popover.Arrow data-testid="arrow" />
              <Popover.Viewport data-testid="viewport">Content</Popover.Viewport>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
  }

  it('names the open/closed attributes on every part per its data attributes enum', async () => {
    const { user } = await renderPopover();

    expect(screen.getByTestId('positioner')).toHaveAttribute(
      PopoverPositionerDataAttributes.closed,
    );
    expect(screen.getByTestId('popup')).toHaveAttribute(PopoverPopupDataAttributes.closed);
    expect(screen.getByTestId('backdrop')).toHaveAttribute(PopoverBackdropDataAttributes.closed);

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('positioner')).toHaveAttribute(PopoverPositionerDataAttributes.open);
    expect(screen.getByTestId('popup')).toHaveAttribute(PopoverPopupDataAttributes.open);
    expect(screen.getByTestId('backdrop')).toHaveAttribute(PopoverBackdropDataAttributes.open);
    expect(screen.getByTestId('arrow')).toHaveAttribute(PopoverArrowDataAttributes.open);
  });

  it('names the trigger attributes per PopoverTriggerDataAttributes', async () => {
    const { user } = await renderPopover();

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    expect(trigger).toHaveAttribute(PopoverTriggerDataAttributes.popupOpen);
    expect(trigger).toHaveAttribute(PopoverTriggerDataAttributes.pressed);
  });

  it('names the side/align attributes per each part data attributes enum', async () => {
    const { user } = await renderPopover();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    for (const [testId, attributes] of [
      ['positioner', PopoverPositionerDataAttributes],
      ['popup', PopoverPopupDataAttributes],
      ['arrow', PopoverArrowDataAttributes],
    ] as const) {
      expect(screen.getByTestId(testId)).toHaveAttribute(attributes.side);
      expect(screen.getByTestId(testId)).toHaveAttribute(attributes.align);
    }
  });

  it('names the instant attribute per the popup and viewport data attributes enums', async () => {
    const { user } = await renderPopover();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    await user.keyboard('[Escape]');

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveAttribute(
        PopoverPopupDataAttributes.instant,
        'dismiss',
      );
    });

    expect(screen.getByTestId('viewport')).toHaveAttribute(
      PopoverViewportDataAttributes.instant,
      'dismiss',
    );
  });

  it('names the viewport `current` attribute per PopoverViewportDataAttributes', async () => {
    const { user } = await renderPopover();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(
      screen.getByTestId('viewport').querySelector(`[${PopoverViewportDataAttributes.current}]`),
    ).not.toBe(null);
  });

  // Covers the members the DOM assertions above can't reach without contriving a transition or a
  // collision, so that every member of every enum in this module is linked to something real.
  it('names the attributes emitted by the shared popup state mappings', () => {
    const openAttribute = Object.keys(popupStateMapping.open(true)!)[0];
    const closedAttribute = Object.keys(popupStateMapping.open(false)!)[0];

    for (const attributes of [
      PopoverPopupDataAttributes,
      PopoverPositionerDataAttributes,
      PopoverBackdropDataAttributes,
      PopoverArrowDataAttributes,
    ]) {
      expect(attributes.open).toBe(openAttribute);
      expect(attributes.closed).toBe(closedAttribute);
    }

    const startingAttribute = Object.keys(transitionStatusMapping.transitionStatus('starting')!)[0];
    const endingAttribute = Object.keys(transitionStatusMapping.transitionStatus('ending')!)[0];

    for (const attributes of [PopoverPopupDataAttributes, PopoverBackdropDataAttributes]) {
      expect(attributes.startingStyle).toBe(startingAttribute);
      expect(attributes.endingStyle).toBe(endingAttribute);
    }

    expect(PopoverPositionerDataAttributes.anchorHidden).toBe(
      Object.keys(popupStateMapping.anchorHidden(true)!)[0],
    );
    expect(PopoverViewportDataAttributes.activationDirection).toBe(
      Object.keys(popupViewportStateMapping.activationDirection!('left down')!)[0],
    );
  });

  // The arrow only reports itself as uncentered once a collision shifts the popup away from the
  // anchor's center, which needs real layout.
  it.skipIf(isJSDOM)('names the uncentered attribute per PopoverArrowDataAttributes', async () => {
    const { user } = await render(
      <Popover.Root>
        <Popover.Trigger style={{ position: 'fixed', top: 8, left: 0, width: 20, height: 20 }}>
          Toggle
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="center" arrowPadding={8}>
            <Popover.Popup style={{ width: 300, height: 40 }}>
              <Popover.Arrow data-testid="arrow" style={{ width: 10, height: 10 }} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    await waitFor(() => {
      expect(screen.getByTestId('arrow')).toHaveAttribute(PopoverArrowDataAttributes.uncentered);
    });
  });

  it.skipIf(isJSDOM)(
    'names the positioner CSS variables per PopoverPositionerCssVars',
    async () => {
      const { user } = await renderPopover();

      await user.click(screen.getByRole('button', { name: 'Toggle' }));

      const positioner = screen.getByTestId('positioner');

      // A single positioning pass writes all of them, so waiting for one is enough.
      await waitFor(() => {
        expect(positioner.style.getPropertyValue(PopoverPositionerCssVars.availableWidth)).not.toBe(
          '',
        );
      });

      expect(positioner.style.getPropertyValue(PopoverPositionerCssVars.availableHeight)).not.toBe(
        '',
      );
      expect(positioner.style.getPropertyValue(PopoverPositionerCssVars.anchorWidth)).not.toBe('');
      expect(positioner.style.getPropertyValue(PopoverPositionerCssVars.anchorHeight)).not.toBe('');
      expect(positioner.style.getPropertyValue(PopoverPositionerCssVars.transformOrigin)).not.toBe(
        '',
      );
    },
  );

  // Only `Popover.Viewport` pulls in the auto-resize pass that writes these, so they exist on the
  // popup and positioner just by rendering one.
  it.skipIf(isJSDOM)('names the size CSS variables written by the viewport', async () => {
    const { user } = await renderPopover();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    const positioner = screen.getByTestId('positioner');
    const popup = screen.getByTestId('popup');

    await waitFor(() => {
      expect(positioner.style.getPropertyValue(PopoverPositionerCssVars.positionerWidth)).not.toBe(
        '',
      );
    });
    await waitFor(() => {
      expect(positioner.style.getPropertyValue(PopoverPositionerCssVars.positionerHeight)).not.toBe(
        '',
      );
    });
    await waitFor(() => {
      expect(popup.style.getPropertyValue(PopoverPopupCssVars.popupWidth)).not.toBe('');
    });
    await waitFor(() => {
      expect(popup.style.getPropertyValue(PopoverPopupCssVars.popupHeight)).not.toBe('');
    });
  });

  describe.skipIf(isJSDOM)('mid-transition viewport', () => {
    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    // The `previous` container and its size variables only exist while the viewport morphs
    // between two triggers' contents, which requires a running exit animation.
    it('names the `previous` attribute and CSS variables per their enums', async () => {
      const { user } = await render(
        <div>
          <style>
            {`
              [data-transitioning] [data-previous] {
                animation: fade-out 0.3s ease-out forwards;
              }
              [data-transitioning] [data-current] {
                animation: fade-in 0.3s ease-out forwards;
              }
              @keyframes fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
              }
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}
          </style>
          <Popover.Root>
            {({ payload }) => (
              <React.Fragment>
                <Popover.Trigger
                  payload="One"
                  style={{ position: 'absolute', top: 10, left: 10, width: 100, height: 50 }}
                >
                  One
                </Popover.Trigger>
                <Popover.Trigger
                  payload="Two"
                  style={{ position: 'absolute', top: 100, left: 200, width: 100, height: 50 }}
                >
                  Two
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <Popover.Viewport data-testid="viewport">
                        <div data-testid="content" style={{ width: 100, height: 40 }}>
                          {payload as string}
                        </div>
                      </Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </React.Fragment>
            )}
          </Popover.Root>
        </div>,
      );

      await user.click(screen.getByRole('button', { name: 'One' }));
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeVisible();
      });

      await user.click(screen.getByRole('button', { name: 'Two' }));

      const viewport = screen.getByTestId('viewport');
      let previous: HTMLElement | null = null;
      await waitFor(() => {
        previous = viewport.querySelector<HTMLElement>(
          `[${PopoverViewportDataAttributes.previous}]`,
        );
        expect(previous).not.toBe(null);
      });

      expect(viewport).toHaveAttribute(PopoverViewportDataAttributes.transitioning);
      expect(previous!.style.getPropertyValue(PopoverViewportCssVars.popupWidth)).not.toBe('');
      expect(previous!.style.getPropertyValue(PopoverViewportCssVars.popupHeight)).not.toBe('');
    });
  });
});
