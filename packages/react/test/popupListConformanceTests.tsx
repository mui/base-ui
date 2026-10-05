import * as React from 'react';
import { expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import type { createRenderer } from '#test-utils';
import { isJSDOM } from '@base-ui/utils/testUtils';
import { resetBrowserPointer } from './resetBrowserPointer';
import { waitSingleFrame } from './wait';

const ITEMS = Array.from({ length: 12 }, (_, index) => `Item ${index}`);
const ITEM_HEIGHT = 30;
const SCROLLER_HEIGHT = 100;

type User = Awaited<ReturnType<PopupListTestConfig['render']>>['user'];

/**
 * Behavior shared by popups that navigate a list of items (Select, Combobox, Menu). The
 * assertions describe what the user sees (highlight, focus, scroll positions) rather than how
 * the component gets there, so any implementation can be checked against them.
 */
export function popupListConformanceTests(config: PopupListTestConfig) {
  const {
    render,
    createComponent,
    itemRole,
    focusModel = 'dom',
    homeEnd = true,
    selectable = false,
    spaceActivates = true,
    listEnd,
    disabledItemNavigation,
  } = config;

  function renderList(options: RenderListOptions = {}) {
    const { root, items = ITEMS, disabledItems = [], onItemClick } = options;
    return render(
      <div>
        <button type="button" data-testid="before">
          Before
        </button>
        {createComponent({
          root,
          items,
          disabledItems,
          onItemClick,
          scrollerStyle: {
            height: SCROLLER_HEIGHT,
            maxHeight: 'none',
            overflowY: 'auto',
            padding: 0,
          },
          itemStyle: { height: ITEM_HEIGHT, boxSizing: 'border-box', margin: 0 },
        })}
        <button type="button" data-testid="after">
          After
        </button>
      </div>,
    );
  }

  function getItem(index: number) {
    return screen.getByRole(itemRole, { name: ITEMS[index] });
  }

  function getHighlightedIndex() {
    const highlighted = screen
      .queryAllByRole(itemRole)
      .find((item) => item.hasAttribute('data-highlighted'));
    return highlighted ? ITEMS.indexOf(highlighted.textContent ?? '') : -1;
  }

  function getFocusOwner() {
    const active = document.activeElement;
    if (active === screen.getByTestId('trigger')) {
      return 'trigger';
    }
    if (screen.queryAllByRole(itemRole).some((item) => item.contains(active))) {
      return 'item';
    }
    if (screen.getByTestId('popup').contains(active)) {
      return 'popup';
    }
    return 'outside';
  }

  function isFullyVisible(item: HTMLElement) {
    const itemRect = item.getBoundingClientRect();
    const scrollerRect = screen.getByTestId('scroller').getBoundingClientRect();
    return itemRect.top >= scrollerRect.top - 1 && itemRect.bottom <= scrollerRect.bottom + 1;
  }

  async function settle() {
    await act(async () => {
      await waitSingleFrame();
      await waitSingleFrame();
    });
  }

  async function waitForOpen() {
    await waitFor(() => {
      expect(screen.getByTestId('trigger')).toHaveAttribute('aria-expanded', 'true');
    });
    await waitFor(() => {
      expect(screen.getAllByRole(itemRole)[0]).toBeVisible();
    });
    // Let opening focus and scroll work scheduled in animation frames settle.
    await settle();
  }

  async function waitForClosed() {
    await waitFor(() => {
      expect(screen.getByTestId('trigger')).toHaveAttribute('aria-expanded', 'false');
    });
  }

  async function openWithMouse(user: User) {
    await user.click(screen.getByTestId('trigger'));
    await waitForOpen();
  }

  async function openWithKeyboard(user: User) {
    await focusTrigger();
    await user.keyboard('{ArrowDown}');
    await waitForOpen();

    // Components differ on whether opening highlights an item; normalize to "something is
    // highlighted" so the navigation tests can move relative to it.
    if (getHighlightedIndex() === -1) {
      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(getHighlightedIndex()).not.toBe(-1);
      });
    }

    return getHighlightedIndex();
  }

  async function focusTrigger() {
    await act(async () => {
      screen.getByTestId('trigger').focus();
    });
  }

  /** Real focus moves to the highlighted item, or stays on the trigger and points at it. */
  async function expectFocusOnItem(index: number) {
    const trigger = screen.getByTestId('trigger');
    if (focusModel === 'virtual') {
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-activedescendant', getItem(index).id);
      });
      expect(trigger).toHaveFocus();
    } else {
      await waitFor(() => {
        expect(getItem(index)).toHaveFocus();
      });
    }
  }

  /** Where the highlight lands after moving past an end of a list of `count` items. */
  function pastEnd(edge: 'first' | 'last', count: number) {
    if (listEnd === 'escape') {
      return -1;
    }
    if (listEnd === 'wrap') {
      return edge === 'first' ? count - 1 : 0;
    }
    return edge === 'first' ? 0 : count - 1;
  }

  async function navigateTo(user: User, from: number, to: number) {
    const key = to > from ? '{ArrowDown}' : '{ArrowUp}';
    for (let i = 0; i < Math.abs(to - from); i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await user.keyboard(key);
    }
    await waitFor(() => {
      expect(getHighlightedIndex()).toBe(to);
    });
  }

  describe('Popup list conformance', () => {
    describe('pointer', () => {
      it('highlights the hovered item', async () => {
        const { user } = await renderList();
        await openWithMouse(user);

        await user.hover(getItem(2));

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(2);
        });
      });

      it('clears the highlight when the pointer leaves the list without leaving focus on an item', async () => {
        const { user } = await renderList();
        await openWithMouse(user);

        await user.hover(getItem(1));
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(1);
        });

        await user.hover(screen.getByTestId('after'));

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(-1);
        });
        // A focused item that no longer looks highlighted would still respond to Enter.
        await waitFor(() => {
          expect(getFocusOwner()).toBe(focusModel === 'virtual' ? 'trigger' : 'popup');
        });
      });

      it('keeps the highlight when a touch scroll starts on the highlighted item', async () => {
        const { user } = await renderList();
        await openWithMouse(user);
        await user.hover(getItem(2));
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(2);
        });

        // The browser takes the touch over for scrolling, cancels the pointer and it leaves.
        const touched = getItem(2);
        fireEvent.pointerDown(touched, { pointerType: 'touch' });
        fireEvent.pointerCancel(touched, { pointerType: 'touch' });
        fireEvent.pointerLeave(touched, {
          pointerType: 'touch',
          relatedTarget: screen.getByTestId('after'),
        });
        await settle();

        expect(getHighlightedIndex()).toBe(2);
      });

      it('does not activate a disabled item', async () => {
        const onItemClick = vi.fn();
        const onValueChange = vi.fn();
        const { user } = await renderList({
          root: selectable ? { onValueChange } : undefined,
          disabledItems: [ITEMS[1]],
          onItemClick,
        });
        await openWithMouse(user);

        await user.hover(getItem(1));
        await user.keyboard('{Enter}');
        await settle();

        expect(onItemClick).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();

        await user.click(getItem(1));
        await settle();

        expect(onItemClick).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.getByTestId('trigger')).toHaveAttribute('aria-expanded', 'true');
        expect(getItem(1)).not.toHaveAttribute('data-selected');

        // An enabled item must reach the same callbacks, so disconnected handlers cannot pass.
        await user.click(getItem(2));
        expect(onItemClick).toHaveBeenCalledTimes(1);
        if (selectable) {
          expect(onValueChange).toHaveBeenCalledTimes(1);
          expect(onValueChange.mock.calls[0][0]).toBe(ITEMS[2]);
        }
      });

      it.skipIf(isJSDOM)(
        'keeps the keyboard highlight while the list scrolls under a resting pointer',
        async ({ onTestFinished }) => {
          // Chromium fires boundary events (but no `mousemove`) as items move under a still
          // pointer, and WebKit fires a zero-movement `mousemove`. Neither is the user pointing.
          const { userEvent } = await import('vitest/browser');
          onTestFinished(resetBrowserPointer);
          const { user } = await renderList();
          await openWithMouse(user);

          await act(async () => {
            await userEvent.hover(getItem(1));
          });
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(1);
          });

          await navigateTo(user, 1, 9);
          await settle();

          expect(getHighlightedIndex()).toBe(9);
        },
      );

      it.skipIf(isJSDOM)(
        'does not scroll the list when hovering a partially visible item at either edge',
        async () => {
          const { user } = await renderList();
          await openWithMouse(user);
          const scroller = screen.getByTestId('scroller');
          expect(scroller.scrollTop).toBe(0);

          // Item 3 spans 90-120px, so only its top 10px are visible.
          await user.hover(getItem(3));
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(3);
          });
          await settle();
          expect(scroller.scrollTop).toBe(0);

          // Item 1 spans 30-60px, so only its bottom 15px are visible.
          await act(async () => {
            scroller.scrollTop = 45;
            await waitSingleFrame();
          });
          await user.hover(getItem(1));
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(1);
          });
          await settle();
          expect(scroller.scrollTop).toBe(45);
        },
      );
    });

    describe('keyboard', () => {
      it('opens on the last item with ArrowUp', async () => {
        const { user } = await renderList();
        await focusTrigger();

        await user.keyboard('{ArrowUp}');
        await waitForOpen();

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(ITEMS.length - 1);
        });
      });

      if (selectable) {
        it.each(['{ArrowDown}', '{ArrowUp}'])('opens on the selected item with %s', async (key) => {
          const { user } = await renderList({ root: { defaultValue: ITEMS[8] } });
          await focusTrigger();

          await user.keyboard(key);
          await waitForOpen();

          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(8);
          });
        });
      }

      it('moves the highlight one item at a time with the arrow keys', async () => {
        const { user } = await renderList();
        const start = await openWithKeyboard(user);

        await user.keyboard('{ArrowDown}');
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(start + 1);
        });

        await user.keyboard('{ArrowUp}');
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(start);
        });
      });

      it('moves focus along with the highlight', async () => {
        const { user } = await renderList();
        const start = await openWithKeyboard(user);
        await expectFocusOnItem(start);

        await user.keyboard('{ArrowDown}');
        await expectFocusOnItem(start + 1);

        await user.keyboard('{ArrowUp}');
        await expectFocusOnItem(start);
      });

      it.each(spaceActivates ? ['{Enter}', ' '] : ['{Enter}'])(
        'activates the highlighted item once with %s',
        async (key) => {
          const activated: string[] = [];
          const onValueChange = vi.fn();
          const { user } = await renderList({
            root: selectable ? { onValueChange } : undefined,
            onItemClick: (event) => activated.push(event.currentTarget.textContent ?? ''),
          });
          const start = await openWithKeyboard(user);
          await user.keyboard('{ArrowDown}');
          await expectFocusOnItem(start + 1);

          await user.keyboard(key);

          await waitForClosed();
          expect(activated).toEqual([ITEMS[start + 1]]);
          if (selectable) {
            expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([ITEMS[start + 1]]);
          }
          await waitFor(() => {
            expect(screen.getByTestId('trigger')).toHaveFocus();
          });
        },
      );

      it(`${disabledItemNavigation === 'reachable' ? 'stops on' : 'skips'} a disabled item while navigating`, async () => {
        const { user } = await renderList({ disabledItems: [ITEMS[2]] });
        const start = await openWithKeyboard(user);
        expect(start).toBe(0);

        await navigateTo(user, 0, 1);
        await user.keyboard('{ArrowDown}');
        const next = disabledItemNavigation === 'reachable' ? 2 : 3;
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(next);
        });

        await user.keyboard('{ArrowUp}');
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(next - 1);
        });
      });

      it('opens past a disabled first item', async () => {
        const { user } = await renderList({ disabledItems: [ITEMS[0]] });

        const start = await openWithKeyboard(user);

        expect(start).toBe(1);
      });

      if (homeEnd) {
        it('moves to the disabled or nearest enabled ends with End and Home', async () => {
          const { user } = await renderList({
            disabledItems: [ITEMS[0], ITEMS[ITEMS.length - 1]],
          });
          await openWithKeyboard(user);
          const reachable = disabledItemNavigation === 'reachable';

          await user.keyboard('{End}');
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(reachable ? ITEMS.length - 1 : ITEMS.length - 2);
          });

          await user.keyboard('{Home}');
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(reachable ? 0 : 1);
          });
        });
      }

      if (homeEnd) {
        it('moves the highlight to the last and first items with End and Home', async () => {
          const { user } = await renderList();
          await openWithKeyboard(user);

          await user.keyboard('{End}');
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(ITEMS.length - 1);
          });

          await user.keyboard('{Home}');
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(0);
          });
        });
      }

      it.skipIf(isJSDOM)('scrolls the highlighted item into view in both directions', async () => {
        const { user } = await renderList();
        const start = await openWithKeyboard(user);

        await navigateTo(user, start, 8);
        await waitFor(() => {
          expect(isFullyVisible(getItem(8))).toBe(true);
        });

        await navigateTo(user, 8, 2);
        await waitFor(() => {
          expect(isFullyVisible(getItem(2))).toBe(true);
        });
      });
    });

    describe('list boundaries', () => {
      const pastEndVerb = { wrap: 'wraps', stop: 'stops', escape: 'leaves the list' }[listEnd];

      it(`${pastEndVerb} past the first item`, async () => {
        const { user } = await renderList();
        const start = await openWithKeyboard(user);
        expect(start).toBe(0);

        await user.keyboard('{ArrowUp}');

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(pastEnd('first', ITEMS.length));
        });
      });

      it(`${pastEndVerb} past the last item`, async () => {
        const { user } = await renderList();
        await focusTrigger();
        await user.keyboard('{ArrowUp}');
        await waitForOpen();
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(ITEMS.length - 1);
        });

        await user.keyboard('{ArrowDown}');

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(pastEnd('last', ITEMS.length));
        });
      });

      it('keeps a single item reachable', async () => {
        const activated: string[] = [];
        const { user } = await renderList({
          items: [ITEMS[0]],
          onItemClick: (event) => activated.push(event.currentTarget.textContent ?? ''),
        });
        await openWithKeyboard(user);

        await user.keyboard('{ArrowDown}');
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(listEnd === 'escape' ? -1 : 0);
        });
        if (listEnd === 'escape') {
          await user.keyboard('{ArrowDown}');
        }
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(0);
        });

        await user.keyboard('{Enter}');
        await waitForClosed();
        expect(activated).toEqual([ITEMS[0]]);
      });

      it('handles keys without an error or losing focus when the list is empty', async () => {
        const onValueChange = vi.fn();
        const { user } = await renderList({ items: [], root: selectable ? { onValueChange } : {} });
        await focusTrigger();

        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}');
        await settle();

        expect(screen.queryAllByRole(itemRole)).toHaveLength(0);
        expect(onValueChange).not.toHaveBeenCalled();
        expect(document.activeElement).not.toBe(document.body);
      });

      it('does not activate anything when every item is disabled', async () => {
        const onItemClick = vi.fn();
        const onValueChange = vi.fn();
        const { user } = await renderList({
          disabledItems: ITEMS,
          onItemClick,
          root: selectable ? { onValueChange } : {},
        });
        await focusTrigger();

        await user.keyboard('{ArrowDown}');
        await waitForOpen();
        await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');
        await settle();

        expect(onItemClick).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(document.activeElement).not.toBe(document.body);
      });
    });

    if (selectable) {
      describe('opening', () => {
        it.skipIf(isJSDOM)('reveals the selected item when opening', async () => {
          const { user } = await renderList({ root: { defaultValue: ITEMS[8] } });
          await openWithMouse(user);

          await waitFor(() => {
            expect(isFullyVisible(getItem(8))).toBe(true);
          });
        });
      });
    }

    describe('dismissal', () => {
      it('closes on Escape and keeps focus on the trigger', async () => {
        const { user } = await renderList();
        await openWithKeyboard(user);

        await user.keyboard('{Escape}');

        await waitForClosed();
        await waitFor(() => {
          expect(screen.getByTestId('trigger')).toHaveFocus();
        });
      });

      it('closes on Tab and moves focus past the trigger', async () => {
        const { user } = await renderList();
        await openWithKeyboard(user);

        await user.keyboard('{Tab}');

        await waitForClosed();
        await waitFor(() => {
          expect(screen.getByTestId('after')).toHaveFocus();
        });
      });

      it('closes on Shift+Tab and moves focus to the element before the popup', async () => {
        const { user } = await renderList();
        await openWithKeyboard(user);

        await user.keyboard('{Shift>}{Tab}{/Shift}');

        await waitForClosed();
        // The popup follows the trigger in focus order, unless focus never left the trigger.
        await waitFor(() => {
          expect(screen.getByTestId(focusModel === 'virtual' ? 'before' : 'trigger')).toHaveFocus();
        });
      });

      it('closes on an outside press', async () => {
        const { user } = await renderList();
        await openWithMouse(user);

        await user.click(document.body);

        await waitForClosed();
      });
    });
  });
}

interface RenderListOptions {
  root?: Record<string, unknown> | undefined;
  items?: readonly string[] | undefined;
  disabledItems?: readonly string[] | undefined;
  onItemClick?: React.MouseEventHandler<HTMLElement> | undefined;
}

export interface PopupListTestProps {
  /** Props for the root part. */
  root?: Record<string, unknown> | undefined;
  /** Labels to render as items, in order. Each label is also the item's value. */
  items: readonly string[];
  /** Labels of the items to render as disabled. */
  disabledItems: readonly string[];
  /** Click handler attached to every item. */
  onItemClick?: React.MouseEventHandler<HTMLElement>;
  /** Styles for the element that scrolls the items. */
  scrollerStyle: React.CSSProperties;
  /** Styles for each item. */
  itemStyle: React.CSSProperties;
}

export interface PopupListTestConfig {
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Renders the component. The element that opens the popup (and keeps focus while it is closed)
   * needs `data-testid="trigger"`, the popup `data-testid="popup"` and the element that scrolls
   * the items `data-testid="scroller"`.
   */
  createComponent: (props: PopupListTestProps) => React.ReactElement;
  itemRole: 'option' | 'menuitem';
  /**
   * `virtual` when focus stays on the trigger while the highlight moves (`aria-activedescendant`).
   * @default 'dom'
   */
  focusModel?: 'dom' | 'virtual';
  /**
   * Whether Home and End move the highlight. Comboboxes leave them to the input caret.
   * @default true
   */
  homeEnd?: boolean;
  /**
   * Whether the component has a value whose item should be revealed on open. When `true`,
   * `root.defaultValue` is passed an item label.
   * @default false
   */
  selectable?: boolean;
  /**
   * Whether Space activates the highlighted item. Comboboxes type it into the input instead.
   * @default true
   */
  spaceActivates?: boolean;
  /**
   * What the arrow keys do past the first or last item: `wrap` to the other end, `stop` there,
   * or `escape` the list, clearing the highlight.
   */
  listEnd: 'wrap' | 'stop' | 'escape';
  /** Whether the arrow keys can highlight disabled items or skip over them. */
  disabledItemNavigation: 'reachable' | 'skipped';
}
