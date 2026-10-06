import * as React from 'react';
import { expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import type { createRenderer } from '#test-utils';
import { isJSDOM } from '@base-ui/utils/testUtils';
import { resetBrowserPointer } from './resetBrowserPointer';
import { wait, waitSingleFrame } from './wait';

const ITEMS = Array.from({ length: 12 }, (_, index) => `Item ${index}`);
const ITEM_HEIGHT = 30;
const SCROLLER_HEIGHT = 100;

type User = Awaited<ReturnType<PopupListTestConfig['render']>>['user'];
type RenderedElement = Parameters<PopupListTestConfig['render']>[0];

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
    enterSpaceOpen = true,
    typeahead = true,
    modal = true,
    triggerClickCloses = true,
    listEnd,
  } = config;

  function buildList(options: RenderListOptions): RenderedElement {
    const {
      root,
      items = ITEMS,
      disabledItems = [],
      onItemClick,
      onOutsideClick,
      wrap = (node) => node,
    } = options;
    return wrap(
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
        <button type="button" data-testid="after" onClick={onOutsideClick}>
          After
        </button>
      </div>,
    );
  }

  function renderList(options: RenderListOptions = {}) {
    return render(buildList(options));
  }

  function getTrigger() {
    return screen.getByTestId('trigger');
  }

  function getItem(index: number) {
    return screen.getByRole(itemRole, { name: ITEMS[index] });
  }

  function getHighlightedIndex() {
    const highlighted = screen
      .queryAllByRole(itemRole)
      .filter((item) => item.hasAttribute('data-highlighted'));
    if (highlighted.length > 1) {
      throw new Error(`Popup list conformance: ${highlighted.length} items are highlighted.`);
    }
    return highlighted.length ? ITEMS.indexOf(highlighted[0].textContent ?? '') : -1;
  }

  function getHighlightedText() {
    return screen.queryAllByRole(itemRole).find((item) => item.hasAttribute('data-highlighted'))
      ?.textContent;
  }

  function getFocusOwner() {
    const active = document.activeElement;
    if (active === getTrigger()) {
      return 'trigger';
    }
    if (screen.queryAllByRole(itemRole).some((item) => item.contains(active))) {
      return 'item';
    }
    if (screen.queryByTestId('popup')?.contains(active)) {
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
      expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    });
    await waitFor(() => {
      expect(screen.getAllByRole(itemRole)[0]).toBeVisible();
    });
    // Let opening focus and scroll work scheduled in animation frames settle.
    await settle();
  }

  async function waitForClosed() {
    await waitFor(() => {
      expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
    });
  }

  async function focusTrigger() {
    await act(async () => {
      getTrigger().focus();
    });
  }

  async function openWithMouse(user: User) {
    await user.click(getTrigger());
    await waitForOpen();
  }

  async function openWithKeyboard(user: User) {
    await focusTrigger();
    await user.keyboard('{ArrowDown}');
    await waitForOpen();
    await waitFor(() => {
      expect(getHighlightedIndex()).not.toBe(-1);
    });
    return getHighlightedIndex();
  }

  /** Real focus moves to the highlighted item, or stays on the trigger and points at it. */
  async function expectFocusOnItem(index: number) {
    const trigger = getTrigger();
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

  /** Nothing is highlighted, and no element is announced as the active descendant either. */
  async function expectNoHighlight() {
    await waitFor(() => {
      expect(getHighlightedIndex()).toBe(-1);
    });
    if (focusModel === 'virtual') {
      expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
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

  function createSpies() {
    const activated: string[] = [];
    const onValueChange = vi.fn();
    return {
      activated,
      onValueChange,
      options: {
        root: selectable ? { onValueChange } : undefined,
        onItemClick: (event: React.MouseEvent<HTMLElement>) => {
          activated.push(event.currentTarget.textContent ?? '');
        },
      } satisfies RenderListOptions,
      expectNothingCommitted() {
        expect(activated).toEqual([]);
        expect(onValueChange).not.toHaveBeenCalled();
      },
    };
  }

  describe('Popup list conformance', () => {
    describe('pointer', () => {
      it('highlights and focuses the hovered item', async () => {
        const { user } = await renderList();
        await openWithMouse(user);

        await user.hover(getItem(2));

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(2);
        });
        await expectFocusOnItem(2);
      });

      it('clears the highlight when the pointer leaves the list without leaving focus on an item', async () => {
        const spies = createSpies();
        const { user } = await renderList(spies.options);
        await openWithMouse(user);

        await user.hover(getItem(1));
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(1);
        });

        await user.hover(screen.getByTestId('after'));

        await expectNoHighlight();
        // A focused item that no longer looks highlighted would still respond to Enter.
        await waitFor(() => {
          expect(getFocusOwner()).toBe(focusModel === 'virtual' ? 'trigger' : 'popup');
        });
        await user.keyboard('{Enter}');
        await settle();
        spies.expectNothingCommitted();
      });

      it('continues keyboard navigation from the hovered item', async () => {
        const { user } = await renderList();
        await openWithMouse(user);
        await user.hover(getItem(4));
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(4);
        });

        await user.keyboard('{ArrowDown}');

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(5);
        });
        await expectFocusOnItem(5);
      });

      it('activates the hovered item with Enter', async () => {
        const spies = createSpies();
        const { user } = await renderList(spies.options);
        await openWithMouse(user);
        await user.hover(getItem(6));
        await expectFocusOnItem(6);

        await user.keyboard('{Enter}');

        await waitForClosed();
        expect(spies.activated).toEqual([ITEMS[6]]);
        if (selectable) {
          expect(spies.onValueChange.mock.calls.map(([value]) => value)).toEqual([ITEMS[6]]);
        }
      });

      it('lets the pointer take the highlight back after keyboard navigation', async () => {
        const { user } = await renderList();
        const start = await openWithKeyboard(user);
        await navigateTo(user, start, 3);

        await user.hover(getItem(1));

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(1);
        });
        await expectFocusOnItem(1);
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
        expect(getItem(1)).toHaveAttribute('aria-disabled', 'true');

        await user.hover(getItem(1));
        await user.keyboard('{Enter}');
        await settle();

        expect(onItemClick).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();

        await user.click(getItem(1));
        await settle();

        expect(onItemClick).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        expect(getItem(1)).not.toHaveAttribute('data-selected');

        // An enabled item must reach the same callbacks, so disconnected handlers cannot pass.
        await user.click(getItem(2));
        expect(onItemClick).toHaveBeenCalledTimes(1);
        if (selectable) {
          expect(onValueChange).toHaveBeenCalledTimes(1);
          expect(onValueChange.mock.calls[0][0]).toBe(ITEMS[2]);
        }
      });

      it('ignores right clicks on the trigger and on items', async () => {
        const spies = createSpies();
        const { user } = await renderList(spies.options);

        await user.pointer({ keys: '[MouseRight]', target: getTrigger() });
        await settle();
        expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');

        await openWithMouse(user);
        await user.pointer({ keys: '[MouseRight]', target: getItem(2) });
        await settle();

        expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        spies.expectNothingCommitted();
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

    describe('opening', () => {
      it('starts without a highlight after a pointer opening', async () => {
        const { user } = await renderList();
        await openWithMouse(user);

        await expectNoHighlight();
        expect(getFocusOwner()).toBe(focusModel === 'virtual' ? 'trigger' : 'popup');

        await user.keyboard('{ArrowDown}');
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(0);
        });
        await expectFocusOnItem(0);
      });

      it('opens on the first item with ArrowDown', async () => {
        const { user } = await renderList();
        await focusTrigger();

        await user.keyboard('{ArrowDown}');
        await waitForOpen();

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(0);
        });
        await expectFocusOnItem(0);
      });

      it('opens on the last item with ArrowUp', async () => {
        const { user } = await renderList();
        await focusTrigger();

        await user.keyboard('{ArrowUp}');
        await waitForOpen();

        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(ITEMS.length - 1);
        });
        await expectFocusOnItem(ITEMS.length - 1);
        if (!isJSDOM) {
          await waitFor(() => {
            expect(isFullyVisible(getItem(ITEMS.length - 1))).toBe(true);
          });
        }
      });

      it('opens past a disabled first item', async () => {
        const { user } = await renderList({ disabledItems: [ITEMS[0]] });

        const start = await openWithKeyboard(user);

        expect(start).toBe(1);
      });

      if (enterSpaceOpen) {
        it.each(['{Enter}', ' '])('opens with %s without activating an item', async (key) => {
          const spies = createSpies();
          const { user } = await renderList(spies.options);
          await focusTrigger();

          await user.keyboard(key);
          await waitForOpen();
          await settle();

          expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
          spies.expectNothingCommitted();
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(0);
          });
          await expectFocusOnItem(0);
        });
      }

      it('starts fresh when reopened after Escape', async () => {
        const { user } = await renderList();
        const start = await openWithKeyboard(user);
        await navigateTo(user, start, 7);
        await user.keyboard('{Escape}');
        await waitForClosed();

        await openWithMouse(user);

        await expectNoHighlight();
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

        it('marks only the selected item as selected', async () => {
          const { user } = await renderList({ root: { defaultValue: ITEMS[8] } });
          await openWithMouse(user);

          expect(getItem(8)).toHaveAttribute('aria-selected', 'true');
          expect(getItem(2)).toHaveAttribute('aria-selected', 'false');
        });

        it.skipIf(isJSDOM)('reveals and highlights the selected item when opening', async () => {
          const { user } = await renderList({ root: { defaultValue: ITEMS[8] } });
          await openWithMouse(user);

          await waitFor(() => {
            expect(isFullyVisible(getItem(8))).toBe(true);
          });
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(8);
          });
        });
      }
    });

    describe('keyboard', () => {
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
          const spies = createSpies();
          const { user } = await renderList(spies.options);
          const start = await openWithKeyboard(user);
          await user.keyboard('{ArrowDown}');
          await expectFocusOnItem(start + 1);

          await user.keyboard(key);

          await waitForClosed();
          expect(spies.activated).toEqual([ITEMS[start + 1]]);
          if (selectable) {
            expect(spies.onValueChange.mock.calls.map(([value]) => value)).toEqual([
              ITEMS[start + 1],
            ]);
          }
          await waitFor(() => {
            expect(getTrigger()).toHaveFocus();
          });
        },
      );

      it('does not submit a surrounding form', async () => {
        const onSubmit = vi.fn();
        const { user } = await renderList({
          wrap: (node) => (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              {node}
              {/* Without a submit button, a form with more than one field never submits implicitly. */}
              <button type="submit">Submit</button>
            </form>
          ),
        });

        await openWithMouse(user);
        await user.keyboard('{Escape}');
        await waitForClosed();
        if (enterSpaceOpen) {
          await focusTrigger();
          await user.keyboard('{Enter}');
          await waitForOpen();
          await user.keyboard('{Escape}');
          await waitForClosed();
        }
        const start = await openWithKeyboard(user);
        await navigateTo(user, start, start + 1);
        await user.keyboard('{Enter}');
        await waitForClosed();

        expect(onSubmit).not.toHaveBeenCalled();
      });

      it('stops on a disabled item while navigating', async () => {
        const { user } = await renderList({ disabledItems: [ITEMS[2]] });
        const start = await openWithKeyboard(user);
        expect(start).toBe(0);

        await navigateTo(user, 0, 1);
        await user.keyboard('{ArrowDown}');
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(2);
        });

        await user.keyboard('{ArrowUp}');
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(1);
        });
      });

      if (homeEnd) {
        it('moves the highlight to the last and first items with End and Home', async () => {
          const { user } = await renderList();
          await openWithKeyboard(user);

          await user.keyboard('{End}');
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(ITEMS.length - 1);
          });
          if (!isJSDOM) {
            await waitFor(() => {
              expect(isFullyVisible(getItem(ITEMS.length - 1))).toBe(true);
            });
          }

          await user.keyboard('{Home}');
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(0);
          });
          if (!isJSDOM) {
            await waitFor(() => {
              expect(isFullyVisible(getItem(0))).toBe(true);
            });
          }
        });

        it('moves to disabled ends with End and Home', async () => {
          const { user } = await renderList({
            disabledItems: [ITEMS[0], ITEMS[ITEMS.length - 1]],
          });
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

      it.skipIf(isJSDOM)(
        'scrolls the highlighted item into view in both directions, only as far as needed',
        async () => {
          const { user } = await renderList();
          const start = await openWithKeyboard(user);
          const scroller = screen.getByTestId('scroller');

          await navigateTo(user, start, 8);
          await waitFor(() => {
            expect(isFullyVisible(getItem(8))).toBe(true);
          });

          // Moving to an item that is already visible doesn't scroll.
          const scrollTop = scroller.scrollTop;
          await navigateTo(user, 8, 7);
          await settle();
          expect(scroller.scrollTop).toBe(scrollTop);

          // Moving one item past the edge scrolls by about one item, rather than recentering.
          await navigateTo(user, 7, 9);
          await waitFor(() => {
            expect(isFullyVisible(getItem(9))).toBe(true);
          });
          expect(scroller.scrollTop - scrollTop).toBeLessThanOrEqual(ITEM_HEIGHT + 1);

          await navigateTo(user, 9, 2);
          await waitFor(() => {
            expect(isFullyVisible(getItem(2))).toBe(true);
          });
        },
      );

      if (typeahead) {
        it.skipIf(isJSDOM)('reveals an item reached by typing its label', async () => {
          const { user } = await renderList();
          await openWithKeyboard(user);

          await user.keyboard('Item 9');

          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(9);
          });
          await waitFor(() => {
            expect(isFullyVisible(getItem(9))).toBe(true);
          });
        });

        it('starts a new typeahead search after a pause', async () => {
          const items = ['Alpha', 'Bravo', 'Charlie'];
          const { user } = await renderList({ items });
          await focusTrigger();
          await user.keyboard('{ArrowDown}');
          await waitForOpen();

          await user.keyboard('b');
          await waitFor(() => {
            expect(getHighlightedText()).toBe('Bravo');
          });

          // Longer than the typeahead reset delay, so `c` is a new search and not `bc`.
          await act(async () => {
            await wait(1000);
          });
          await user.keyboard('c');

          await waitFor(() => {
            expect(getHighlightedText()).toBe('Charlie');
          });
        });
      }

      it('prevents the default scrolling of navigation keys', async () => {
        const { user } = await renderList();
        await expectFocusOnItem(await openWithKeyboard(user));

        for (const key of homeEnd
          ? ['ArrowDown', 'ArrowUp', 'End', 'Home']
          : ['ArrowDown', 'ArrowUp']) {
          const target = document.activeElement ?? document.body;
          // `fireEvent` returns `false` when a handler prevented the default action.
          expect(fireEvent.keyDown(target, { key })).toBe(false);
        }
      });
    });

    describe('list boundaries', () => {
      const pastEndVerb = { wrap: 'wraps', stop: 'stops', escape: 'leaves the list' }[listEnd];

      it(`${pastEndVerb} past the first item`, async () => {
        const { user } = await renderList();
        const start = await openWithKeyboard(user);
        expect(start).toBe(0);

        await user.keyboard('{ArrowUp}');

        const expected = pastEnd('first', ITEMS.length);
        if (expected === -1) {
          await expectNoHighlight();
        } else {
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(expected);
          });
        }
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

        const expected = pastEnd('last', ITEMS.length);
        if (expected === -1) {
          await expectNoHighlight();
        } else {
          await waitFor(() => {
            expect(getHighlightedIndex()).toBe(expected);
          });
          if (!isJSDOM) {
            await waitFor(() => {
              expect(isFullyVisible(getItem(expected))).toBe(true);
            });
          }
        }
      });

      it('keeps a single item reachable', async () => {
        const spies = createSpies();
        const { user } = await renderList({ ...spies.options, items: [ITEMS[0]] });
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
        expect(spies.activated).toEqual([ITEMS[0]]);
      });

      it('opens and handles keys without losing focus when the list is empty', async () => {
        const { user } = await renderList({ items: [] });
        await focusTrigger();

        const focusOwner = focusModel === 'virtual' ? 'trigger' : 'popup';

        await user.keyboard('{ArrowDown}');
        await waitFor(() => {
          expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
        });
        await waitFor(() => {
          expect(getFocusOwner()).toBe(focusOwner);
        });

        await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');
        await settle();

        expect(getFocusOwner()).toBe(focusOwner);
      });

      it('does not activate anything when every item is disabled', async () => {
        const spies = createSpies();
        const { user } = await renderList({ ...spies.options, disabledItems: ITEMS });
        await focusTrigger();

        await user.keyboard('{ArrowDown}');
        await waitForOpen();
        await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');
        await settle();

        spies.expectNothingCommitted();
        expect(['trigger', 'item', 'popup']).toContain(getFocusOwner());
      });
    });

    describe('dismissal', () => {
      it('closes on Escape without committing, and keeps focus on the trigger', async () => {
        const spies = createSpies();
        const { user } = await renderList(spies.options);
        const start = await openWithKeyboard(user);
        await navigateTo(user, start, start + 1);

        await user.keyboard('{Escape}');

        await waitForClosed();
        await waitFor(() => {
          expect(getTrigger()).toHaveFocus();
        });
        expect(getTrigger()).not.toHaveAttribute('aria-activedescendant');
        spies.expectNothingCommitted();
      });

      it('closes on Tab without committing, and moves focus past the trigger', async () => {
        const spies = createSpies();
        const { user } = await renderList(spies.options);
        const start = await openWithKeyboard(user);
        await navigateTo(user, start, start + 1);

        await user.keyboard('{Tab}');

        await waitForClosed();
        await waitFor(() => {
          expect(screen.getByTestId('after')).toHaveFocus();
        });
        spies.expectNothingCommitted();
      });

      it('closes on Shift+Tab without committing, and moves focus to the element before the popup', async () => {
        const spies = createSpies();
        const { user } = await renderList(spies.options);
        const start = await openWithKeyboard(user);
        await navigateTo(user, start, start + 1);

        await user.keyboard('{Shift>}{Tab}{/Shift}');

        await waitForClosed();
        // The popup follows the trigger in focus order, unless focus never left the trigger.
        await waitFor(() => {
          expect(screen.getByTestId(focusModel === 'virtual' ? 'before' : 'trigger')).toHaveFocus();
        });
        spies.expectNothingCommitted();
      });

      it('closes on an outside press without committing', async () => {
        const spies = createSpies();
        const { user } = await renderList(spies.options);
        await openWithMouse(user);
        await user.hover(getItem(1));
        await waitFor(() => {
          expect(getHighlightedIndex()).toBe(1);
        });

        await user.click(document.body);

        await waitForClosed();
        spies.expectNothingCommitted();
      });

      it.skipIf(isJSDOM)(
        `closes on a real outside click ${modal ? 'that the page underneath does not receive' : 'that reaches the page underneath'}`,
        async ({ onTestFinished }) => {
          const { userEvent } = await import('vitest/browser');
          onTestFinished(resetBrowserPointer);
          const onOutsideClick = vi.fn();
          const { user } = await renderList({ onOutsideClick });
          await openWithMouse(user);

          // `force` clicks at the button's position even when a backdrop covers it.
          await act(async () => {
            await userEvent.click(screen.getByTestId('after'), { force: true });
          });

          await waitForClosed();
          expect(onOutsideClick).toHaveBeenCalledTimes(modal ? 0 : 1);
        },
      );

      if (triggerClickCloses) {
        it('closes when the trigger is clicked again', async () => {
          const { user } = await renderList();
          await openWithMouse(user);

          await user.click(getTrigger());

          await waitForClosed();
          await settle();
          expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
        });
      }

      it('closes only itself on Escape inside a dialog', async () => {
        const { user } = await renderList({
          wrap: (node) => (
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup data-testid="dialog">{node}</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          ),
        });
        await openWithKeyboard(user);

        await user.keyboard('{Escape}');

        await waitForClosed();
        expect(screen.getByTestId('dialog')).toBeVisible();

        await user.keyboard('{Escape}');
        await waitFor(() => {
          expect(screen.queryByTestId('dialog')).toBe(null);
        });
      });
    });
  });
}

interface RenderListOptions {
  root?: Record<string, unknown> | undefined;
  items?: readonly string[] | undefined;
  disabledItems?: readonly string[] | undefined;
  onItemClick?: React.MouseEventHandler<HTMLElement> | undefined;
  /** Click handler for the button rendered after the component. */
  onOutsideClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  /** Wraps the rendered tree, such as in a form or a dialog. */
  wrap?: ((node: RenderedElement) => RenderedElement) | undefined;
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
   * Whether the component has a value. When `true`, `root` receives `defaultValue` and
   * `onValueChange`; activating an item must call `onValueChange` with its label, and opening
   * must highlight, reveal, and mark the selected item with `aria-selected`.
   * @default false
   */
  selectable?: boolean;
  /**
   * Whether Space activates the highlighted item. Comboboxes type it into the input instead.
   * @default true
   */
  spaceActivates?: boolean;
  /**
   * Whether Enter and Space open the popup from the trigger.
   * @default true
   */
  enterSpaceOpen?: boolean;
  /**
   * Whether typing moves the highlight to a matching item, rather than filtering the list.
   * @default true
   */
  typeahead?: boolean;
  /**
   * Whether the open popup blocks pointer interaction with the rest of the page.
   * @default true
   */
  modal?: boolean;
  /**
   * Whether clicking the trigger while the popup is open closes it.
   * @default true
   */
  triggerClickCloses?: boolean;
  /**
   * What the arrow keys do past the first or last item: `wrap` to the other end, `stop` there,
   * or `escape` the list, clearing the highlight.
   */
  listEnd: 'wrap' | 'stop' | 'escape';
}
