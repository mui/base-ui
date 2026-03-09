import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { fireEvent, screen, flushMicrotasks, act, within, waitFor } from '@mui/internal-test-utils';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
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
        <NavigationMenu.Positioner data-testid="top-level-positioner">
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

function TestInlineNestedNavigationMenu(props: { nestedDefaultValue?: string | null } = {}) {
  const { nestedDefaultValue = 'nested-item-1' } = props;
  const nestedRootProps =
    nestedDefaultValue == null ? undefined : { defaultValue: nestedDefaultValue };

  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Item 1</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Link href="#link-1">Link 1</NavigationMenu.Link>
            <NavigationMenu.Root {...nestedRootProps}>
              <NavigationMenu.List data-testid="inline-nested-list">
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

              <NavigationMenu.Viewport data-testid="inline-nested-viewport" />
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

function TestInlineNestedNavigationMenuWithoutDefaultValue() {
  return <TestInlineNestedNavigationMenu nestedDefaultValue={null} />;
}

function TestInlineNestedNavigationMenuWithDynamicContent() {
  const [showExtraContent, setShowExtraContent] = React.useState(false);

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
                    <button
                      type="button"
                      data-testid="insert-content"
                      onClick={() => {
                        setShowExtraContent(true);
                      }}
                    >
                      Insert content
                    </button>
                    {showExtraContent && (
                      <div data-testid="extra-content">
                        <NavigationMenu.Link href="#nested-link-1">
                          Nested Link 1
                        </NavigationMenu.Link>
                        <NavigationMenu.Link href="#nested-link-2">
                          Nested Link 2
                        </NavigationMenu.Link>
                        <NavigationMenu.Link href="#nested-link-3">
                          Nested Link 3
                        </NavigationMenu.Link>
                      </div>
                    )}
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>

              <NavigationMenu.Viewport />
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner data-testid="positioner">
          <NavigationMenu.Popup data-testid="popup-root">
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function TestInlineNestedNavigationMenuTabForwardBoundary() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-1">Product</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="popup-1">
            <NavigationMenu.Root defaultValue="nested-item-2">
              <NavigationMenu.List>
                <NavigationMenu.Item value="nested-item-1">
                  <NavigationMenu.Trigger data-testid="nested-trigger-1">
                    Engineering Leads
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="nested-popup-1">
                    <NavigationMenu.Link href="#releases">Releases</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
                <NavigationMenu.Item value="nested-item-2">
                  <NavigationMenu.Trigger data-testid="nested-trigger-2">
                    Startups
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="nested-popup-2">
                    <NavigationMenu.Link href="#quick-start">Quick start</NavigationMenu.Link>
                    <NavigationMenu.Link href="#menu">Menu</NavigationMenu.Link>
                    <NavigationMenu.Link href="#select" data-testid="nested-last-link">
                      Select
                    </NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>

              <NavigationMenu.Viewport />
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="item-2">
          <NavigationMenu.Trigger data-testid="trigger-2">Learn</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="popup-2">
            <NavigationMenu.Link href="#learn">Learn link</NavigationMenu.Link>
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

function TestInlineNestedNavigationMenuTabFlow() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-product">Product</NavigationMenu.Trigger>

          <NavigationMenu.Content data-testid="popup-product">
            <NavigationMenu.Root defaultValue="developers" orientation="vertical">
              <NavigationMenu.List>
                <NavigationMenu.Item value="developers">
                  <NavigationMenu.Trigger data-testid="nested-trigger-developers">
                    Developers
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="nested-popup-developers">
                    <NavigationMenu.Link href="#get-started" data-testid="nested-link-get-started">
                      Get started
                    </NavigationMenu.Link>
                    <NavigationMenu.Link href="#composition" data-testid="nested-link-composition">
                      Composition
                    </NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
                <NavigationMenu.Item value="design-systems">
                  <NavigationMenu.Trigger data-testid="nested-trigger-design-systems">
                    Design Systems
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content data-testid="nested-popup-design-systems">
                    <NavigationMenu.Link
                      href="#styling"
                      data-testid="nested-link-design-systems-styling"
                    >
                      Styling
                    </NavigationMenu.Link>
                    <NavigationMenu.Link href="#accessibility">Accessibility</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
                <NavigationMenu.Item value="engineering-leads">
                  <NavigationMenu.Trigger>Engineering Leads</NavigationMenu.Trigger>
                  <NavigationMenu.Content>
                    <NavigationMenu.Link href="#releases">Releases</NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>

              <NavigationMenu.Viewport />
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="item-2">
          <NavigationMenu.Trigger data-testid="trigger-learn">Learn</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <NavigationMenu.Link href="#learn">Learn link</NavigationMenu.Link>
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

function TestNavigationMenuWithKeepMountedContent() {
  return (
    <NavigationMenu.Root defaultValue="item-1">
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-product">Product</NavigationMenu.Trigger>
          <NavigationMenu.Content keepMounted>
            <div style={{ width: 675, height: 220 }}>Product panel</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="item-2">
          <NavigationMenu.Trigger data-testid="trigger-learn">Learn</NavigationMenu.Trigger>
          <NavigationMenu.Content keepMounted>
            <div style={{ width: 500, height: 180 }}>Learn panel</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner data-testid="positioner">
          <NavigationMenu.Popup data-testid="popup-root">
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function TestNavigationMenuWithScopedPopupExitAnimation(
  props: {
    onOpenChangeComplete?: NavigationMenu.Root.Props['onOpenChangeComplete'];
  } = {},
) {
  const { onOpenChangeComplete } = props;
  const style = `
    .test-navigation-menu-popup {
      transition-property: opacity, transform, width, height;
      transition-duration: 350ms;
      transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
    }

    .test-navigation-menu-popup[data-starting-style],
    .test-navigation-menu-popup[data-ending-style] {
      opacity: 0;
      transform: scale(0.9);
    }

    .test-navigation-menu-popup[data-ending-style] {
      transition-property: opacity, transform;
      transition-duration: 150ms;
      transition-timing-function: ease;
    }

    .test-navigation-menu-content {
      transition:
        opacity 175ms ease,
        transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .test-navigation-menu-content[data-starting-style],
    .test-navigation-menu-content[data-ending-style] {
      opacity: 0;
    }

    .test-navigation-menu-content[data-starting-style][data-activation-direction='left'] {
      transform: translateX(-2rem);
    }

    .test-navigation-menu-content[data-starting-style][data-activation-direction='right'] {
      transform: translateX(2rem);
    }

    .test-navigation-menu-content[data-ending-style] {
      transition-duration: 175ms;
      transition-timing-function: ease;
    }

    .test-navigation-menu-content[data-ending-style][data-activation-direction='left'] {
      transform: translateX(2rem);
    }

    .test-navigation-menu-content[data-ending-style][data-activation-direction='right'] {
      transform: translateX(-2rem);
    }
  `;

  return (
    <NavigationMenu.Root onOpenChangeComplete={onOpenChangeComplete}>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <NavigationMenu.List>
        <NavigationMenu.Item value="item-1">
          <NavigationMenu.Trigger data-testid="trigger-product">Product</NavigationMenu.Trigger>
          <NavigationMenu.Content className="test-navigation-menu-content">
            <div style={{ width: 675, height: 220 }}>Product panel</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item value="item-2">
          <NavigationMenu.Trigger data-testid="trigger-learn">Learn</NavigationMenu.Trigger>
          <NavigationMenu.Content className="test-navigation-menu-content">
            <div style={{ width: 500, height: 180 }}>Learn panel</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup className="test-navigation-menu-popup" data-testid="popup-root">
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function mockBoundingClientRect(
  element: Element,
  rect: { x: number; y: number; width: number; height: number },
) {
  const domRect = {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.y,
    left: rect.x,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    toJSON: () => ({}),
  };

  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => domRect,
  });
}

function mockAnimations(element: HTMLElement) {
  let resolveFinished: (() => void) | null = null;
  let finishedPromise = Promise.resolve();

  Object.defineProperty(element, 'getAnimations', {
    configurable: true,
    value: () => [{ finished: finishedPromise }],
  });

  return {
    start() {
      finishedPromise = new Promise<void>((resolve) => {
        resolveFinished = resolve;
      });
    },
    finish() {
      resolveFinished?.();
      resolveFinished = null;
    },
  };
}

function mockResizeObserver() {
  const originalResizeObserver = globalThis.ResizeObserver;

  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  return () => {
    globalThis.ResizeObserver = originalResizeObserver;
  };
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

    it('blocks pointer events on the body while traversing from a top-level trigger to the popup', async () => {
      await render(<TestNavigationMenu />);
      const trigger = screen.getByTestId('trigger-1');
      const siblingTrigger = screen.getByTestId('trigger-2');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      clock.tick(50);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(document.body.style.pointerEvents).to.equal('none');
      expect(getComputedStyle(siblingTrigger).pointerEvents).to.equal('none');

      fireEvent.mouseEnter(screen.getByTestId('top-level-positioner'));
      await flushMicrotasks();

      expect(document.body.style.pointerEvents).to.equal('');
    });

    it.skipIf(isJSDOM)(
      'blocks pointer events on sibling top-level triggers when opened through real hover',
      async () => {
        const { user } = await render(<TestNavigationMenu />);
        const trigger = screen.getByTestId('trigger-1');
        const siblingTrigger = screen.getByTestId('trigger-2');

        await user.hover(trigger);

        await waitFor(() => {
          expect(document.body.style.pointerEvents).to.equal('none');
        });

        expect(getComputedStyle(siblingTrigger).pointerEvents).to.equal('none');
      },
    );

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

    it.skipIf(isJSDOM)('restores hover open after a touch click closes outside', async () => {
      const { user } = await render(
        <div>
          <TestNavigationMenu />
          <button data-testid="outside" />
        </div>,
      );
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      fireEvent.pointerEnter(trigger1, { pointerType: 'touch' });
      fireEvent.pointerDown(trigger1, { pointerType: 'touch' });
      fireEvent.pointerUp(trigger1, { pointerType: 'touch' });
      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);

      await user.click(screen.getByTestId('outside'));
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).to.equal(null);

      await user.hover(trigger2);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-2')).not.to.equal(null);
      });
    });

    it.skipIf(isJSDOM)(
      'restores hover open after touching a nested submenu trigger and closing outside',
      async () => {
        const { user } = await render(
          <div>
            <TestInlineNestedNavigationMenu />
            <button data-testid="outside" />
          </div>,
        );
        const trigger = screen.getByTestId('trigger-1');

        fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
        fireEvent.pointerDown(trigger, { pointerType: 'touch' });
        fireEvent.pointerUp(trigger, { pointerType: 'touch' });
        fireEvent.click(trigger);
        await flushMicrotasks();

        const nestedTrigger2 = screen.getByTestId('nested-trigger-2');
        fireEvent.pointerEnter(nestedTrigger2, { pointerType: 'touch' });
        fireEvent.pointerDown(nestedTrigger2, { pointerType: 'touch' });
        fireEvent.pointerUp(nestedTrigger2, { pointerType: 'touch' });
        fireEvent.click(nestedTrigger2);
        await flushMicrotasks();

        expect(screen.queryByTestId('nested-popup-2')).not.to.equal(null);

        await user.click(screen.getByTestId('outside'));
        await flushMicrotasks();

        expect(screen.queryByTestId('popup-1')).to.equal(null);

        await user.hover(trigger);

        await waitFor(() => {
          expect(screen.queryByTestId('popup-1')).not.to.equal(null);
        });
      },
    );

    it('restores hover open after a quick click then trigger switch', async () => {
      const { user } = await render(<TestNavigationMenu />);
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      await user.hover(trigger1);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      });

      await user.click(trigger1);
      await flushMicrotasks();

      await user.hover(trigger2);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-2')).not.to.equal(null);
      });

      await user.unhover(trigger2);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-2')).to.equal(null);
      });

      await user.hover(trigger1);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      });
    });

    it('closes after pointerdown on a link in a hover-open popup when pointer leaves', async () => {
      const { user } = await render(<TestNavigationMenu />);
      const trigger1 = screen.getByTestId('trigger-1');

      await user.hover(trigger1);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      });

      const popup1 = screen.getByTestId('popup-1');
      const link1 = within(popup1).getByText('Link 1');

      await user.hover(link1);
      fireEvent.pointerDown(link1, { pointerType: 'mouse' });
      await user.unhover(link1);

      await waitFor(() => {
        expect(screen.queryByTestId('popup-1')).to.equal(null);
      });
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

    it('keeps parent menu open when hovering inline nested triggers without defaultValue', async () => {
      await render(<TestInlineNestedNavigationMenuWithoutDefaultValue />);
      const trigger1 = screen.getByTestId('trigger-1');

      fireEvent.mouseEnter(trigger1);
      fireEvent.mouseMove(trigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      const popup1 = screen.getByTestId('popup-1');
      const nestedTrigger1 = within(popup1).getByTestId('nested-trigger-1');
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'false');

      fireEvent.mouseEnter(nestedTrigger1);
      fireEvent.mouseMove(nestedTrigger1);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');
      expect(screen.getByTestId('nested-popup-1')).not.to.equal(null);
      expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');

      const nestedTrigger2 = within(popup1).getByTestId('nested-trigger-2');
      fireEvent.mouseEnter(nestedTrigger2);
      fireEvent.mouseMove(nestedTrigger2);
      clock.tick(OPEN_DELAY);
      await flushMicrotasks();

      expect(screen.queryByTestId('popup-1')).not.to.equal(null);
      expect(trigger1).to.have.attribute('aria-expanded', 'true');
      expect(screen.getByTestId('nested-popup-2')).not.to.equal(null);
      expect(nestedTrigger2).to.have.attribute('aria-expanded', 'true');
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

      it('scopes inline safePolygon pointer events to the submenu list while traversing to the viewport', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.mouseEnter(trigger1);
        fireEvent.mouseMove(trigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        const nestedList = screen.getByTestId('inline-nested-list');
        const nestedTrigger1 = screen.getByTestId('nested-trigger-1');
        const nestedViewport = screen.getByTestId('inline-nested-viewport');

        mockBoundingClientRect(nestedTrigger1, { x: 0, y: 40, width: 100, height: 40 });
        mockBoundingClientRect(nestedViewport, { x: 200, y: 0, width: 300, height: 300 });
        fireEvent.mouseEnter(nestedTrigger1);

        expect(nestedList.style.pointerEvents).to.equal('none');

        fireEvent.mouseLeave(nestedTrigger1, {
          clientX: 98,
          clientY: 60,
        });

        expect(nestedList.style.pointerEvents).to.equal('none');
        expect(document.body.style.pointerEvents).to.equal('none');

        fireEvent.mouseMove(document, { clientX: 150, clientY: 80 });
        await flushMicrotasks();

        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');
        expect(screen.getByTestId('nested-popup-1')).not.to.equal(null);
        expect(nestedList.style.pointerEvents).to.equal('none');

        fireEvent.mouseEnter(nestedViewport);
        await flushMicrotasks();

        expect(nestedList.style.pointerEvents).to.equal('');
      });

      it('clears inline safePolygon pointer events when the pointer leaves the traversal path', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.mouseEnter(trigger1);
        fireEvent.mouseMove(trigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        const nestedList = screen.getByTestId('inline-nested-list');
        const nestedTrigger1 = screen.getByTestId('nested-trigger-1');
        const nestedViewport = screen.getByTestId('inline-nested-viewport');

        mockBoundingClientRect(nestedTrigger1, { x: 0, y: 40, width: 100, height: 40 });
        mockBoundingClientRect(nestedViewport, { x: 200, y: 0, width: 300, height: 300 });
        fireEvent.mouseEnter(nestedTrigger1);

        expect(nestedList.style.pointerEvents).to.equal('none');

        fireEvent.mouseLeave(nestedTrigger1, {
          clientX: 98,
          clientY: 60,
        });
        expect(nestedList.style.pointerEvents).to.equal('none');

        fireEvent.mouseMove(document, { clientX: 40, clientY: 220 });
        await flushMicrotasks();

        expect(nestedList.style.pointerEvents).to.equal('');
        expect(nestedTrigger1).to.have.attribute('aria-expanded', 'true');
        expect(screen.getByTestId('nested-popup-1')).not.to.equal(null);
      });

      it('keeps inline safePolygon pointer events when returning to the original trigger before traversing again', async () => {
        await render(<TestInlineNestedNavigationMenu />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.mouseEnter(trigger1);
        fireEvent.mouseMove(trigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        const nestedList = screen.getByTestId('inline-nested-list');
        const nestedTrigger1 = screen.getByTestId('nested-trigger-1');
        const nestedTrigger2 = screen.getByTestId('nested-trigger-2');
        const nestedViewport = screen.getByTestId('inline-nested-viewport');

        mockBoundingClientRect(nestedTrigger1, { x: 0, y: 40, width: 100, height: 40 });
        mockBoundingClientRect(nestedTrigger2, { x: 0, y: 100, width: 100, height: 40 });
        mockBoundingClientRect(nestedViewport, { x: 200, y: 0, width: 300, height: 300 });

        fireEvent.mouseEnter(nestedTrigger1);
        fireEvent.mouseLeave(nestedTrigger1, {
          clientX: 98,
          clientY: 60,
        });
        fireEvent.mouseMove(document, { clientX: 150, clientY: 80 });
        await flushMicrotasks();
        fireEvent.mouseEnter(nestedViewport);
        await flushMicrotasks();

        fireEvent.mouseEnter(nestedTrigger2);
        fireEvent.mouseMove(nestedTrigger2);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        fireEvent.mouseEnter(nestedTrigger1);
        fireEvent.mouseMove(nestedTrigger1);
        clock.tick(OPEN_DELAY);
        await flushMicrotasks();

        expect(nestedList.style.pointerEvents).to.equal('none');

        fireEvent.mouseLeave(nestedTrigger1, {
          clientX: 98,
          clientY: 60,
        });
        fireEvent.mouseMove(document, { clientX: 150, clientY: 80 });
        await flushMicrotasks();

        expect(nestedList.style.pointerEvents).to.equal('none');
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

      it('updates popup sizing when inline nested content is inserted while active', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const previousAnimationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        if (typeof originalResizeObserver === 'function') {
          globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
        }

        try {
          await render(<TestInlineNestedNavigationMenuWithDynamicContent />);
          const trigger1 = screen.getByTestId('trigger-1');

          fireEvent.click(trigger1);
          await flushMicrotasks();

          const popupRoot = screen.getByTestId('popup-root');
          const positioner = screen.getByTestId('positioner');
          const animations = mockAnimations(popupRoot);

          let popupWidth = 250;
          let popupHeight = 120;

          Object.defineProperty(popupRoot, 'offsetWidth', {
            configurable: true,
            get: () => popupWidth,
          });
          Object.defineProperty(popupRoot, 'offsetHeight', {
            configurable: true,
            get: () => popupHeight,
          });

          popupWidth = 250;
          popupHeight = 220;
          animations.start();
          fireEvent.click(screen.getByTestId('insert-content'));
          await flushMicrotasks();

          expect(screen.getByTestId('extra-content')).not.to.equal(null);
          await waitFor(() => {
            expect(
              parseInt(getComputedStyle(positioner).getPropertyValue('--positioner-height'), 10),
            ).to.equal(220);
          });

          await act(async () => {
            animations.finish();
            await flushMicrotasks();
          });

          await waitFor(() => {
            expect(popupRoot.style.getPropertyValue('--popup-width')).to.equal('auto');
            expect(popupRoot.style.getPropertyValue('--popup-height')).to.equal('auto');
            expect(positioner.style.getPropertyValue('--positioner-width')).to.equal('250px');
            expect(positioner.style.getPropertyValue('--positioner-height')).to.equal('220px');
          });
        } finally {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = previousAnimationsDisabled;
          if (typeof originalResizeObserver === 'function') {
            globalThis.ResizeObserver = originalResizeObserver;
          }
        }
      });

      it('updates popup sizing immediately when switching to a keepMounted trigger', async () => {
        const restoreResizeObserver = mockResizeObserver();
        const previousAnimationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        try {
          await render(<TestNavigationMenuWithKeepMountedContent />);

          const popupRoot = screen.getByTestId('popup-root');
          const positioner = screen.getByTestId('positioner');
          const animations = mockAnimations(popupRoot);

          let popupWidth = 675;
          let popupHeight = 220;

          Object.defineProperty(popupRoot, 'offsetWidth', {
            configurable: true,
            get: () => popupWidth,
          });
          Object.defineProperty(popupRoot, 'offsetHeight', {
            configurable: true,
            get: () => popupHeight,
          });

          popupRoot.style.setProperty('--popup-width', 'auto');
          popupRoot.style.setProperty('--popup-height', 'auto');
          positioner.style.setProperty('--positioner-width', '675px');
          positioner.style.setProperty('--positioner-height', '220px');

          popupWidth = 500;
          popupHeight = 180;
          animations.start();
          fireEvent.click(screen.getByTestId('trigger-learn'));
          await flushMicrotasks();

          expect(positioner.style.getPropertyValue('--positioner-width')).to.equal('500px');
          expect(positioner.style.getPropertyValue('--positioner-height')).to.equal('180px');

          await act(async () => {
            animations.finish();
            await flushMicrotasks();
          });

          await waitFor(() => {
            expect(popupRoot.style.getPropertyValue('--popup-width')).to.equal('auto');
            expect(popupRoot.style.getPropertyValue('--popup-height')).to.equal('auto');
            expect(positioner.style.getPropertyValue('--positioner-width')).to.equal('500px');
            expect(positioner.style.getPropertyValue('--positioner-height')).to.equal('180px');
          });
        } finally {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = previousAnimationsDisabled;
          restoreResizeObserver();
        }
      });

      it.skipIf(isJSDOM)('closes on the short exit path after switching content', async () => {
        const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        try {
          const onOpenChangeComplete = spy();
          const { user } = await render(
            <TestNavigationMenuWithScopedPopupExitAnimation
              onOpenChangeComplete={onOpenChangeComplete}
            />,
          );

          await user.click(screen.getByTestId('trigger-product'));
          await flushMicrotasks();

          await user.click(screen.getByTestId('trigger-learn'));
          await flushMicrotasks();

          const popupRoot = screen.getByTestId('popup-root');

          await waitFor(() => {
            const hasRunningAnimations = popupRoot
              .getAnimations()
              .some((animation) => animation.playState !== 'finished');
            expect(hasRunningAnimations).to.equal(false);
          });

          const closeStart = performance.now();
          fireEvent.keyDown(screen.getByTestId('trigger-learn'), { key: 'Escape' });
          await flushMicrotasks();

          await waitFor(() => {
            expect(onOpenChangeComplete.callCount).to.equal(1);
            expect(onOpenChangeComplete.firstCall.args[0]).to.equal(false);
          });

          expect(performance.now() - closeStart).to.be.lessThan(325);
        } finally {
          globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
        }
      });

      it('does not collapse popup size to zero on close if a measurement temporarily returns 0', async () => {
        await render(<TestInlineNestedNavigationMenuWithDynamicContent />);
        const trigger1 = screen.getByTestId('trigger-1');

        fireEvent.click(trigger1);
        await flushMicrotasks();

        const popupRoot = screen.getByTestId('popup-root');
        const positioner = screen.getByTestId('positioner');

        popupRoot.style.setProperty('--popup-width', '250px');
        popupRoot.style.setProperty('--popup-height', '120px');
        positioner.style.setProperty('--positioner-width', '250px');
        positioner.style.setProperty('--positioner-height', '120px');

        Object.defineProperty(popupRoot, 'offsetWidth', {
          configurable: true,
          get: () => 0,
        });
        Object.defineProperty(popupRoot, 'offsetHeight', {
          configurable: true,
          get: () => 0,
        });
        Object.defineProperty(positioner, 'offsetWidth', {
          configurable: true,
          get: () => 0,
        });
        Object.defineProperty(positioner, 'offsetHeight', {
          configurable: true,
          get: () => 0,
        });

        fireEvent.blur(trigger1, { relatedTarget: document.body });
        await flushMicrotasks();

        expect(popupRoot.style.getPropertyValue('--popup-width')).to.equal('250px');
        expect(popupRoot.style.getPropertyValue('--popup-height')).to.equal('120px');
        expect(positioner.style.getPropertyValue('--positioner-width')).to.equal('250px');
        expect(positioner.style.getPropertyValue('--positioner-height')).to.equal('120px');
      });

      it('tabs from the last link of the last nested panel to the next top-level trigger', async () => {
        const { user } = await render(<TestInlineNestedNavigationMenuTabForwardBoundary />);
        const trigger1 = screen.getByTestId('trigger-1');

        await user.click(trigger1);
        await flushMicrotasks();

        const nestedLastLink = screen.getByTestId('nested-last-link');
        await act(async () => nestedLastLink.focus());
        expect(nestedLastLink).toHaveFocus();

        await user.tab();

        expect(screen.getByTestId('trigger-2')).toHaveFocus();
        expect(screen.getByTestId('nested-popup-2')).not.to.equal(null);
        expect(screen.getByTestId('nested-trigger-2')).to.have.attribute('aria-expanded', 'true');
      });

      it('tabs between nested triggers and links without opening inactive panels', async () => {
        const { user } = await render(<TestInlineNestedNavigationMenuTabFlow />);
        const triggerProduct = screen.getByTestId('trigger-product');

        await user.click(triggerProduct);
        await flushMicrotasks();

        const nestedDevelopersTrigger = screen.getByTestId('nested-trigger-developers');
        await act(async () => nestedDevelopersTrigger.focus());
        expect(nestedDevelopersTrigger).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('nested-link-get-started')).toHaveFocus();

        await user.tab({ shift: true });
        expect(nestedDevelopersTrigger).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('nested-link-get-started')).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('nested-link-composition')).toHaveFocus();

        await user.tab();
        expect(screen.getByTestId('nested-trigger-design-systems')).toHaveFocus();
        expect(screen.queryByTestId('nested-popup-design-systems')).to.equal(null);

        await user.tab();
        expect(screen.getByText('Engineering Leads')).toHaveFocus();
      });
    });
  });
});
