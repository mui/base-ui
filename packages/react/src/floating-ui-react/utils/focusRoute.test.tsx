import * as React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, ignoreActWarnings, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, enterWithMouse, isJSDOM, resetBrowserPointer } from '#test-utils';
import { FloatingRootStore } from '../components/FloatingRootStore';
import { PopupTriggerMap } from '../../utils/popups';
import {
  AFTER_CONTENT,
  AFTER_PORTAL,
  AFTER_TRIGGER,
  BACKWARD,
  BEFORE_CONTENT,
  BEFORE_PORTAL,
  BEFORE_TRIGGER,
  FIRST,
  FORWARD,
  FROM_CONTENT,
  FROM_OUTSIDE,
  FROM_TRIGGER,
  LAST,
  NEXT,
  PREVIOUS,
  TRIGGER,
  focusRoute,
  getFocusRoute,
  getFocusRouteDecision,
} from './focusRoute';
import type { FocusRouteOrigin, FocusRouteSlot, FocusRouteTarget } from './focusRoute';

describe('getFocusRouteDecision', () => {
  // An open, non-modal popover: the content follows its trigger, and every guard is rendered.
  const popover = {
    open: true,
    modal: false,
    contentGuards: true,
    triggerGuards: true,
    followsTrigger: true,
    closeOnFocusOut: true,
  };

  function route(
    slot: FocusRouteSlot,
    from: FocusRouteOrigin,
    overrides: Partial<typeof popover> = {},
  ) {
    const facts = { ...popover, ...overrides };
    const [target, close = false] = getFocusRouteDecision(
      slot,
      from,
      facts.open,
      facts.modal,
      facts.contentGuards,
      facts.triggerGuards,
      facts.followsTrigger,
      facts.closeOnFocusOut,
    );
    return { target, close };
  }

  function to(target: FocusRouteTarget, close = false) {
    return { target, close };
  }

  describe('around the trigger', () => {
    it('Shift+Tab from the trigger leaves and closes', () => {
      expect(route(BEFORE_TRIGGER, FROM_TRIGGER)).toEqual(to(BACKWARD, true));
      expect(route(BEFORE_TRIGGER, FROM_TRIGGER, { open: false })).toEqual(to(BACKWARD));
    });

    it('Tab from before the trigger reaches it', () => {
      expect(route(BEFORE_TRIGGER, FROM_OUTSIDE)).toEqual(to(TRIGGER));
    });

    it('Tab from the trigger enters the content', () => {
      expect(route(AFTER_TRIGGER, FROM_TRIGGER)).toEqual(to(BEFORE_CONTENT));
    });

    it('Tab from the trigger leaves past content without guards and closes', () => {
      expect(route(AFTER_TRIGGER, FROM_TRIGGER, { contentGuards: false })).toEqual(
        to(FORWARD, true),
      );
      expect(route(AFTER_TRIGGER, FROM_TRIGGER, { open: false })).toEqual(to(FORWARD));
    });

    it('Tab out of the content leaves past the trigger and closes', () => {
      expect(route(AFTER_TRIGGER, FROM_CONTENT)).toEqual(to(FORWARD, true));
    });

    it('Shift+Tab from after the trigger reaches it', () => {
      expect(route(AFTER_TRIGGER, FROM_OUTSIDE)).toEqual(to(TRIGGER));
    });
  });

  describe('around the portal placeholder', () => {
    it('Tab into the portal enters the content', () => {
      expect(route(BEFORE_PORTAL, FROM_OUTSIDE)).toEqual(to(BEFORE_CONTENT));
      expect(route(BEFORE_PORTAL, FROM_TRIGGER)).toEqual(to(BEFORE_CONTENT));
      expect(route(BEFORE_PORTAL, FROM_OUTSIDE, { contentGuards: false })).toEqual(to(FORWARD));
    });

    it('Shift+Tab out of the portal leaves without closing', () => {
      expect(route(BEFORE_PORTAL, FROM_CONTENT)).toEqual(to(BACKWARD));
    });

    it('Shift+Tab into the portal enters the end of the content', () => {
      expect(route(AFTER_PORTAL, FROM_OUTSIDE)).toEqual(to(AFTER_CONTENT));
      expect(route(AFTER_PORTAL, FROM_OUTSIDE, { open: false })).toEqual(to(BACKWARD));
    });

    it('Tab out of the portal leaves and closes unless closeOnFocusOut is off', () => {
      expect(route(AFTER_PORTAL, FROM_CONTENT)).toEqual(to(FORWARD, true));
      expect(route(AFTER_PORTAL, FROM_CONTENT, { closeOnFocusOut: false })).toEqual(to(FORWARD));
    });
  });

  describe('around the content', () => {
    it('Tab into the content focuses its first tabbable element', () => {
      expect(route(BEFORE_CONTENT, FROM_OUTSIDE)).toEqual(to(NEXT));
      expect(route(BEFORE_CONTENT, FROM_TRIGGER)).toEqual(to(NEXT));
    });

    it('Shift+Tab into the content focuses its last tabbable element', () => {
      expect(route(AFTER_CONTENT, FROM_OUTSIDE)).toEqual(to(PREVIOUS));
    });

    it('Shift+Tab out of the content returns to the trigger it follows', () => {
      expect(route(BEFORE_CONTENT, FROM_CONTENT)).toEqual(to(TRIGGER));
      expect(route(BEFORE_CONTENT, FROM_CONTENT, { followsTrigger: false })).toEqual(
        to(BEFORE_PORTAL),
      );
    });

    it('Tab out of the content leaves through the trigger guard if there is one', () => {
      expect(route(AFTER_CONTENT, FROM_CONTENT)).toEqual(to(AFTER_TRIGGER));
      expect(route(AFTER_CONTENT, FROM_CONTENT, { triggerGuards: false })).toEqual(
        to(AFTER_PORTAL),
      );
    });

    it('wraps around the content when modal', () => {
      expect(route(BEFORE_CONTENT, FROM_CONTENT, { modal: true })).toEqual(to(LAST));
      expect(route(AFTER_CONTENT, FROM_CONTENT, { modal: true })).toEqual(to(FIRST));
    });
  });
});

describe('focusRoute', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function setup() {
    const before = document.createElement('button');
    const trigger = document.createElement('button');
    const after = document.createElement('button');
    const positioner = document.createElement('div');
    const inside = document.createElement('button');
    const guards = Array.from({ length: 6 }, () => {
      const guard = document.createElement('span');
      guard.tabIndex = 0;
      return guard;
    });
    positioner.append(guards[BEFORE_CONTENT], inside, guards[AFTER_CONTENT]);
    document.body.append(
      before,
      guards[BEFORE_TRIGGER],
      trigger,
      guards[AFTER_TRIGGER],
      guards[BEFORE_PORTAL],
      guards[AFTER_PORTAL],
      after,
      positioner,
    );

    const onOpenChange = vi.fn();
    const store = new FloatingRootStore({
      open: true,
      transitionStatus: undefined,
      referenceElement: trigger,
      floatingElement: positioner,
      triggerElements: new PopupTriggerMap(),
      floatingId: undefined,
      nested: false,
      onOpenChange,
    });
    const route = getFocusRoute(store);
    guards.forEach((guard, slot) => {
      route[slot].current = guard;
    });

    function reach(slot: FocusRouteSlot, relatedTarget: Element, followsTrigger?: boolean) {
      const guard = guards[slot];
      guard.focus();
      focusRoute(
        store,
        {
          currentTarget: guard,
          relatedTarget,
          nativeEvent: new FocusEvent('focus', { relatedTarget }),
        } as unknown as React.FocusEvent<HTMLElement>,
        undefined,
        false,
        followsTrigger,
      );
    }

    return { store, trigger, guards, after, inside, route, onOpenChange, reach };
  }

  it('leaves past the portal guards when the consumer refuses the close', () => {
    const { guards, after, onOpenChange, reach } = setup();

    reach(AFTER_TRIGGER, guards[AFTER_CONTENT]);

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'focus-out' }),
    );
    expect(after).toHaveFocus();
  });

  it('leaves past the placeholder when the trigger is no longer in the document', () => {
    const { trigger, guards, inside, reach } = setup();
    trigger.remove();

    reach(BEFORE_CONTENT, inside, true);

    expect(guards[BEFORE_PORTAL]).toHaveFocus();
  });

  it('continues from the trigger that replaced the closed one', () => {
    const { store, trigger, guards, after, route, onOpenChange, reach } = setup();
    // The close unmounts the trigger guard, and the consumer renders a new trigger element.
    onOpenChange.mockImplementation(() => {
      const nextTrigger = document.createElement('button');
      trigger.replaceWith(nextTrigger);
      guards[AFTER_TRIGGER].remove();
      route[AFTER_TRIGGER].current = null;
      store.update({ domReferenceElement: nextTrigger });
    });

    reach(AFTER_TRIGGER, guards[AFTER_CONTENT]);

    expect(after).toHaveFocus();
  });
});

describe.skipIf(isJSDOM)('focus route through the guards', () => {
  const { render } = createRenderer();

  // Native Tab runs a microtask checkpoint between the trigger's blur and the guard's focus,
  // which `@testing-library`'s synthetic events skip.
  let user: Awaited<typeof import('vitest/browser')>['userEvent'];
  beforeAll(async () => {
    ({ userEvent: user } = await import('vitest/browser'));
  });

  beforeEach(() => {
    ignoreActWarnings();
    // The guards outlive `open` by a microtask only while exit animations run.
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
  });

  describe.each([
    { name: 'Popover', Component: Popover },
    { name: 'Menu', Component: Menu },
  ])('$name', ({ name, Component }) => {
    function TestPopup(props: {
      tabIndex?: number;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      className?: string;
      finalFocus?: Popover.Popup.Props['finalFocus'];
    }) {
      return (
        <Component.Root modal={false} open={props.open} onOpenChange={props.onOpenChange}>
          <Component.Trigger tabIndex={props.tabIndex}>Toggle</Component.Trigger>
          <Component.Portal>
            <Component.Positioner>
              <Component.Popup
                className={props.className}
                data-testid="popup"
                finalFocus={props.finalFocus}
              >
                {name === 'Menu' ? (
                  <Menu.Item data-testid="inside">Inside</Menu.Item>
                ) : (
                  <button data-testid="inside">Inside</button>
                )}
              </Component.Popup>
            </Component.Positioner>
          </Component.Portal>
        </Component.Root>
      );
    }

    async function openPopup() {
      const trigger = screen.getByRole('button', { name: 'Toggle' });
      await user.click(trigger);
      // Menu moves focus to the popup itself; Popover moves it to the first tabbable inside.
      await waitFor(() => {
        expect(screen.getByTestId(name === 'Popover' ? 'inside' : 'popup')).toHaveFocus();
      });
      return trigger;
    }

    describe.each(['forward', 'backward'] as const)('tabbing %s', (direction) => {
      /** Puts focus on the element the upcoming Tab should leave from. */
      async function focusTabOrigin(trigger: HTMLElement) {
        await act(async () =>
          (direction === 'backward' ? trigger : screen.getByTestId('inside')).focus(),
        );
      }

      it.each([
        ['ref', 0],
        ['function', 0],
        ['ref', -1],
        ['function', -1],
      ] as const)(
        'preserves the tab destination after the exit transition with finalFocus as a %s and trigger tabIndex=%s',
        async (finalFocusType, tabIndex) => {
          const finalFocusRef = React.createRef<HTMLButtonElement>();

          await render(
            <div>
              <style>{`
                .popup { transition: opacity 200ms; }
                .popup[data-ending-style] { opacity: 0; }
              `}</style>
              <button data-testid="before">Before</button>
              <TestPopup
                tabIndex={tabIndex}
                className="popup"
                finalFocus={finalFocusType === 'ref' ? finalFocusRef : () => true}
              />
              <button data-testid="after">After</button>
              <button ref={finalFocusRef}>Final focus</button>
            </div>,
          );

          const trigger = await openPopup();

          if (direction === 'backward' && name === 'Popover') {
            await user.tab({ shift: true });
          } else {
            // Menu closes on Shift+Tab from its content, so focus the trigger directly instead.
            await focusTabOrigin(trigger);
          }

          expect(direction === 'backward' ? trigger : screen.getByTestId('inside')).toHaveFocus();
          expect(trigger).toHaveAttribute('aria-expanded', 'true');

          await user.tab({ shift: direction === 'backward' });

          const destination = screen.getByTestId(direction === 'backward' ? 'before' : 'after');
          expect(destination).toHaveFocus();
          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBe(null);
          });
          expect(destination).toHaveFocus();
          expect(trigger).toHaveAttribute('tabindex', String(tabIndex));
        },
      );

      it.each(['disabled', 'tabIndex', 'hidden', 'removed', 'inserted', 'reordered'] as const)(
        'uses the current tab order when an adjacent control is %s during close',
        async (change) => {
          function Fixture() {
            const [open, setOpen] = React.useState(false);
            const target = (
              <button key="target" data-testid="target">
                Target
              </button>
            );
            const candidate = (
              <button
                key="candidate"
                disabled={change === 'disabled' && !open}
                tabIndex={change === 'tabIndex' && !open ? -1 : 0}
                hidden={change === 'hidden' && !open}
              >
                Candidate
              </button>
            );
            let controls: React.ReactNode[];
            if (change === 'inserted') {
              controls = [!open && target, candidate];
            } else if (change === 'reordered') {
              controls = open ? [candidate, target] : [target, candidate];
            } else {
              controls = [change === 'removed' && !open ? null : candidate, target];
            }

            return (
              <div>
                {direction === 'backward' && controls.reverse()}
                <TestPopup tabIndex={-1} open={open} onOpenChange={setOpen} />
                {direction === 'forward' && controls}
              </div>
            );
          }

          await render(<Fixture />);
          await focusTabOrigin(await openPopup());
          await user.tab({ shift: direction === 'backward' });

          expect(screen.getByTestId('target')).toHaveFocus();
          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBe(null);
          });
          expect(screen.getByTestId('target')).toHaveFocus();
        },
      );

      it('preserves the surrounding modal dialog focus trap', async () => {
        await render(
          <div>
            <button>Outside dialog</button>
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup style={{ position: 'relative' }}>
                  {direction === 'forward' && <button>Inside dialog</button>}
                  <TestPopup tabIndex={-1} />
                  {direction === 'backward' && <button>Inside dialog</button>}
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>,
        );

        const destination = screen.getByRole('button', { name: 'Inside dialog' });
        await waitFor(() => {
          expect(destination).toHaveFocus();
        });

        await focusTabOrigin(await openPopup());
        await user.tab({ shift: direction === 'backward' });

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).toBe(null);
        });
        await waitFor(() => {
          expect(destination).toHaveFocus();
        });
      });

      it.each([0, -1])(
        'returns focus to the trigger when no outside element is tabbable and trigger tabIndex=%s',
        async (tabIndex) => {
          await render(<TestPopup tabIndex={tabIndex} />);

          const trigger = await openPopup();
          await focusTabOrigin(trigger);

          await user.tab({ shift: direction === 'backward' });

          expect(trigger).toHaveFocus();
          await waitFor(() => {
            expect(screen.queryByTestId('popup')).toBe(null);
          });
          expect(trigger).toHaveFocus();
          expect(trigger).toHaveAttribute('tabindex', String(tabIndex));
        },
      );
    });
  });
  describe('while the popup is open and focus is outside it', () => {
    beforeEach(resetBrowserPointer);

    describe('Menu', () => {
      it('tabs forward onto the trigger instead of bouncing off its leading guard', async () => {
        await render(
          <div>
            <button data-testid="before">Before</button>
            <Menu.Root modal={false}>
              <Menu.Trigger openOnHover delay={0}>
                Toggle
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-testid="popup">
                    <Menu.Item>Inside</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <button data-testid="after">After</button>
          </div>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        const before = screen.getByTestId('before');
        await act(async () => before.focus());
        enterWithMouse(trigger);
        await waitFor(() => {
          expect(screen.queryByTestId('popup')).not.toBe(null);
        });
        // A hover-opened menu still moves focus inside on a later frame; wait for it to land
        // before moving focus back out.
        await waitFor(() => {
          expect(screen.getByTestId('popup').contains(document.activeElement)).toBe(true);
        });
        await act(async () => before.focus());

        await user.tab();

        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    describe('hover-opened Popover', () => {
      it('tabs backward onto the trigger from the element after it', async () => {
        await render(
          <div>
            <button data-testid="before">Before</button>
            <Popover.Root>
              <Popover.Trigger openOnHover delay={0}>
                Toggle
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup">
                    <button>Inside</button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <button data-testid="after">After</button>
          </div>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        const after = screen.getByTestId('after');
        await act(async () => after.focus());
        enterWithMouse(trigger);
        await waitFor(() => {
          expect(screen.queryByTestId('popup')).not.toBe(null);
        });
        // Hover-opening leaves focus where it was.
        expect(after).toHaveFocus();

        await user.tab({ shift: true });

        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('when the consumer refuses the focus-out close', () => {
    describe('Menu', () => {
      function RefusingMenu() {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button data-testid="before">Before</button>
            <Menu.Root
              modal={false}
              open={open}
              onOpenChange={(nextOpen, details) => {
                if (details.reason !== 'focus-out') {
                  setOpen(nextOpen);
                }
              }}
            >
              <Menu.Trigger>Toggle</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-testid="popup">
                    <Menu.Item data-testid="inside">Inside</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
            <button data-testid="after">After</button>
          </div>
        );
      }

      it('tabs out to the element after the trigger instead of looping back inside', async () => {
        await render(<RefusingMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await user.click(trigger);
        const inside = screen.getByTestId('inside');
        await waitFor(() => {
          expect(screen.getByTestId('popup').contains(document.activeElement)).toBe(true);
        });
        await act(async () => inside.focus());

        await user.tab();

        expect(screen.getByTestId('after')).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Menu opened without a trigger', () => {
    it('tabs out of the popup to the element after its portal', async () => {
      await render(
        <div>
          <button data-testid="before">Before</button>
          <Menu.Root defaultOpen modal={false}>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup data-testid="popup">
                  <Menu.Item data-testid="inside">Inside</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <button data-testid="after">After</button>
        </div>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('popup').contains(document.activeElement)).toBe(true);
      });
      await act(async () => screen.getByTestId('inside').focus());

      await user.tab();

      expect(screen.getByTestId('after')).toHaveFocus();
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBe(null);
      });
    });
  });
});
