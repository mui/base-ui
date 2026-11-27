import type * as React from 'react';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { activeElement, contains, getTarget } from '@base-ui/utils/shadowDom';
import { ownerDocument } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';
import { isElement } from '@floating-ui/utils/dom';
import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { MaybeBaseUIEvent } from '../../internals/types';
import { getHighlightReason } from '../../utils/getHighlightReason';
import { stopEvent } from '../../utils/popups/event';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import type { UseTypeaheadReturnValue } from '../../utils/popups/interactions/useTypeahead';
import type { TreeItemId, TreeMultiple, TreeDefaultItem, TreeState } from '../store/types';

import type { TreeStore } from '../store/TreeStore';
import { selectors } from '../store/selectors';
import { isWithinInteractiveContent } from '../utils/isWithinInteractiveContent';
import { getItemIdKey, ITEM_KEY_ATTRIBUTE } from '../utils/itemIdKey';
import {
  getFirstNavigableChild,
  getFirstNavigableItem,
  getLastNavigableItem,
  getNextNavigableItem,
  getPreviousNavigableItem,
} from '../store/treeNavigation';

/** Where DOM focus sits relative to the tree container. */
export type FocusLocation = 'lost' | 'inside' | 'outside';

/** The part of the typeahead that the tree's key handler uses. */
type TreeTypeahead = Pick<UseTypeaheadReturnValue, 'onKeyDown' | 'endSession'>;

function isPrintableKey(key: string): boolean {
  return key.length === 1 && !!key.match(/\S/);
}

export class TreeInteractionPlugin<TItem = TreeDefaultItem> {
  declare private store: TreeStore<TreeMultiple | undefined, TItem>;

  /**
   * The keydown or press that moves focus next, which the highlight reason derives
   * from. `undefined` when nothing the tree saw caused it, such as tabbing into the
   * tree or focus recovery, so the focus event itself is reported.
   */
  private focusCause: Event | undefined = undefined;

  /** The typeahead of the element with the tree role, which `useTreeRootProps` sets up. */
  private typeahead: TreeTypeahead | null = null;

  /** Whether a typeahead search is in progress, in which Space continues it. */
  private typing = false;

  private focusRecoveryCleanup: (() => void) | null = null;

  /**
   * The focused row a collapse hid, and the ancestor that took focus from it.
   * Cleared once focus moves to another row.
   */
  public focusHandover: { from: TreeItemId; to: TreeItemId } | null = null;

  private focusRecoveryFrame = AnimationFrame.create();

  private controlRecoveryFrame = AnimationFrame.create();

  /** The click a link item's expansion trigger handled, which its row ignores. */
  private triggerClick: Event | null = null;

  /** The pointer type of the last press on a row, so a touch tap can be told apart from a click. */
  private lastPointerType: string | null = null;

  /** Whether the click a row is handling comes from Space or Enter. */
  private keyboardClick = false;

  constructor(store: TreeStore<TreeMultiple | undefined, TItem>) {
    this.store = store;
  }

  /**
   * Sets up store subscriptions for focus recovery when items are removed,
   * hidden, or become ineligible for focus.
   * Must be called from TreeStore.layoutMountEffect so it is re-subscribed after
   * React Strict Mode's unmount/remount cycle.
   */
  public setupFocusRecovery = () => {
    let previousState = this.store.state;

    this.focusRecoveryCleanup = this.store.subscribe((newState) => {
      this.recoverFocus(newState, previousState);
      previousState = newState;
    });
  };

  private recoverFocus(newState: TreeState<TItem>, previousState: TreeState<TItem>): void {
    const newMetaLookup = newState.itemMetaLookup;
    const previousMetaLookup = previousState.itemMetaLookup;

    const focusedId = newState.focusedItemId;
    if (focusedId == null) {
      const lastFocusedId = newState.lastFocusedItemId;
      if (lastFocusedId != null) {
        const removed =
          newMetaLookup[getItemIdKey(lastFocusedId)] == null &&
          previousMetaLookup[getItemIdKey(lastFocusedId)] != null;
        // Focus is outside the tree, so the removed row's tab stop goes to the
        // neighbor that would have taken focus.
        if (removed) {
          this.store.set(
            'lastFocusedItemId',
            this.getRemovedItemSuccessor(newState, previousState, lastFocusedId),
          );
        }
        if (
          selectors.isItemVisible(previousState, lastFocusedId) &&
          !selectors.isItemVisible(newState, lastFocusedId)
        ) {
          this.recoverFocusLeavingWithItem(removed ? null : lastFocusedId);
        }
      }
      this.recoverFocusFromContainer(newState, previousState);
      return;
    }

    if (newMetaLookup[getItemIdKey(focusedId)] != null) {
      if (selectors.isItemVisible(newState, focusedId)) {
        // A focused row can become ineligible without leaving the collection:
        // its own disabled flag, an ancestor's flag, the root disabled state,
        // or `itemFocusableWhenDisabled` may change. Keep the roving tab stop
        // and DOM focus on a focusable row, or fall back to the tree container
        // when none remain.
        if (!selectors.canItemBeFocused(newState, focusedId)) {
          this.focusNavigableItemNear(newState, focusedId);
        }
        return;
      }

      // A collapse hid the focused row (an ancestor collapsed). It stays in the
      // collection, so the removal recovery below won't fire, but its row
      // unmounts once the group animation ends and focus falls to <body>. Move
      // focus to the collapsed ancestor, per the ARIA tree pattern.
      if (selectors.isViewTransformed(newState)) {
        const rootElement = this.store.context.rootRef.current;
        // A filter input commonly lives outside the tree. Its focus must not
        // be stolen merely because the tree's logical focused item vanished.
        if (rootElement != null && this.getFocusLocation(rootElement) !== 'outside') {
          const target =
            this.store.filtering?.getFocusableMatch(newState, 'first') ??
            getFirstNavigableItem(newState);
          if (target == null) {
            this.releaseFocusToRoot(true);
          } else {
            this.scheduleFocusRecovery((_rootElement, focusLocation) => {
              if (focusLocation !== 'outside') {
                this.focusItem(target);
              }
            });
          }
        }
        return;
      }

      // The nearest visible ancestor is the shallowest collapsed one
      // (`ancestorIds` is root-first): everything above it is expanded.
      const target =
        selectors
          .ancestorIds(newState, focusedId)
          .find((ancestorId) => !selectors.isItemExpanded(newState, ancestorId)) ?? null;
      if (target == null) {
        return;
      }
      if (selectors.canItemBeFocused(newState, target)) {
        this.focusRecoveryTarget(target, () => {
          this.focusHandover = { from: focusedId, to: target };
        });
      } else {
        this.focusNavigableItemNear(newState, target);
      }
      return;
    }

    // An earlier update removed the focused item and already chose its neighbor.
    if (
      newMetaLookup === previousMetaLookup ||
      previousMetaLookup[getItemIdKey(focusedId)] == null
    ) {
      return;
    }

    const itemToFocusId = this.getRemovedItemSuccessor(newState, previousState, focusedId);
    if (itemToFocusId == null) {
      this.releaseFocusToRoot(true);
      return;
    }
    this.scheduleFocusRecovery((rootElement, focusLocation) => {
      // If another element on the page already has focus, don't steal it.
      // This happens e.g. when an item is moved to a different tree.
      if (focusLocation !== 'lost' && activeElement(ownerDocument(rootElement)) !== rootElement) {
        return;
      }
      const state = this.store.state;
      const target = selectors.isItemFocusTarget(state, itemToFocusId)
        ? itemToFocusId
        : getFirstNavigableItem(state);
      if (target != null) {
        this.focusItem(target);
      } else {
        this.clearFocusedItem();
        rootElement.focus({ preventScroll: true });
      }
    });
  }

  /**
   * Puts focus back in the tree when the row that had it last leaves the view and
   * takes the focus with it. Focus was outside the tree, such as in a menu opened
   * from one of the row's controls: the menu unmounts with the row, so it can't
   * return focus to its trigger, and focus would fall to `<body>`.
   *
   * `hiddenItemId` is the row when it stays in the collection, hidden by a collapse
   * or a filter, and `null` when it was removed.
   */
  private recoverFocusLeavingWithItem(hiddenItemId: TreeItemId | null): void {
    const rootElement = this.store.context.rootRef.current;
    // Focus that was already lost before this update didn't leave with the row.
    if (rootElement == null || this.getFocusLocation(rootElement) !== 'outside') {
      return;
    }
    this.scheduleFocusRecovery((root, focusLocation) => {
      // Focus that moved elsewhere, such as back to a trigger outside the tree, stays there.
      if (focusLocation !== 'lost') {
        return;
      }
      const state = this.store.state;
      // As for a focused row, a collapse hands focus to the shallowest collapsed ancestor.
      const ancestor =
        hiddenItemId == null || selectors.isViewTransformed(state)
          ? null
          : (selectors
              .ancestorIds(state, hiddenItemId)
              .find((ancestorId) => !selectors.isItemExpanded(state, ancestorId)) ?? null);
      if (ancestor != null && selectors.isItemFocusTarget(state, ancestor)) {
        this.focusItem(ancestor);
      } else if (!this.focusTabStop()) {
        root.focus({ preventScroll: true });
      }
    });
  }

  /** Focuses the closest row that can take focus from the visible row `itemId`, or the tree container when none can. */
  private focusNavigableItemNear(state: TreeState<TItem>, itemId: TreeItemId): void {
    const target =
      getNextNavigableItem(state, itemId) ??
      getPreviousNavigableItem(state, itemId) ??
      getFirstNavigableItem(state);
    if (target != null) {
      this.focusRecoveryTarget(target);
    } else {
      this.releaseFocusToRoot(false);
    }
  }

  /** The closest row that is still a focus target after `itemId` was removed. */
  private getRemovedItemSuccessor(
    newState: TreeState<TItem>,
    previousState: TreeState<TItem>,
    itemId: TreeItemId,
  ): TreeItemId | null {
    const findNeighbor = (step: (state: TreeState<TItem>, id: TreeItemId) => TreeItemId | null) => {
      let probe = step(previousState, itemId);
      while (probe != null && !selectors.isItemFocusTarget(newState, probe)) {
        probe = step(previousState, probe);
      }
      return probe;
    };
    return (
      findNeighbor(getNextNavigableItem) ??
      findNeighbor(getPreviousNavigableItem) ??
      getFirstNavigableItem(newState)
    );
  }

  /**
   * Hands focus to the tab stop row once the tree container holding focus gets
   * one, such as when rows arrive in an empty tree. The container then leaves
   * the tab order, so the browser would drop its focus, and keys pressed on it
   * would reach no row.
   */
  private recoverFocusFromContainer(
    newState: TreeState<TItem>,
    previousState: TreeState<TItem>,
  ): void {
    const rootElement = this.store.context.rootRef.current;
    if (
      rootElement == null ||
      activeElement(ownerDocument(rootElement)) !== rootElement ||
      selectors.tabbableItemId(previousState) != null ||
      selectors.tabbableItemId(newState) == null
    ) {
      return;
    }
    this.scheduleFocusRecovery((root, focusLocation) => {
      const target = selectors.tabbableItemId(this.store.state);
      if (
        target != null &&
        (focusLocation === 'lost' || activeElement(ownerDocument(root)) === root)
      ) {
        this.focusItem(target);
      }
    });
  }

  /** Clears the focused item, and reports that no row is highlighted when one was. */
  private clearFocusedItem(): void {
    if (this.store.state.focusedItemId == null) {
      return;
    }
    this.store.set('focusedItemId', null);
    this.store.context.onItemHighlighted?.(undefined, createGenericEventDetails(REASONS.none));
  }

  /**
   * Clears the focused item once no row can take focus, and moves DOM focus to
   * the tree container on the next frame unless it is outside the tree, or,
   * with `onlyWhenLost`, anywhere at all.
   */
  private releaseFocusToRoot(onlyWhenLost: boolean): void {
    this.clearFocusedItem();
    this.scheduleFocusRecovery((rootElement, focusLocation) => {
      if (onlyWhenLost ? focusLocation === 'lost' : focusLocation !== 'outside') {
        rootElement.focus({ preventScroll: true });
      }
    });
  }

  /**
   * Focuses the row recovery chose. When the update that triggered the recovery
   * also added that row, it is focused once React has rendered it.
   */
  private focusRecoveryTarget(itemId: TreeItemId, onFocused?: () => void): void {
    if (this.store.items.getItemDOMElement(itemId) != null) {
      this.focusItem(itemId);
      onFocused?.();
      return;
    }
    this.scheduleFocusRecovery((_rootElement, focusLocation) => {
      if (focusLocation !== 'outside') {
        this.focusItem(itemId);
        onFocused?.();
      }
    });
  }

  /** Where DOM focus is relative to the tree root. */
  public getFocusLocation(rootElement: HTMLElement): FocusLocation {
    const doc = ownerDocument(rootElement);
    const active = activeElement(doc);
    if (active == null || active === doc.body) {
      return 'lost';
    }
    return contains(rootElement, active) ? 'inside' : 'outside';
  }

  /**
   * Runs `callback` on the next frame, once React has committed the rows the
   * recovery targets. Rapid successive changes keep only the latest callback so
   * no orphaned frame focuses a stale candidate.
   */
  private scheduleFocusRecovery(
    callback: (rootElement: HTMLElement, focusLocation: FocusLocation) => void,
    frame = this.focusRecoveryFrame,
  ): void {
    frame.request(() => {
      const rootElement = this.store.context.rootRef.current;
      if (rootElement != null) {
        callback(rootElement, this.getFocusLocation(rootElement));
      }
    });
  }

  public cleanupFocusRecovery = () => {
    this.focusRecoveryCleanup?.();
    this.focusRecoveryCleanup = null;
    this.focusRecoveryFrame.cancel();
    this.controlRecoveryFrame.cancel();
  };

  /**
   * Moves focus back to the item once a focused control has left the DOM,
   * unless something else took focus in the meantime.
   */
  public recoverFocusFromRemovedControl(itemId: TreeItemId) {
    this.scheduleFocusRecovery((_rootElement, focusLocation) => {
      // Leave focus alone when something already took it deliberately.
      if (focusLocation === 'lost' && selectors.itemMeta(this.store.state, itemId) != null) {
        this.focusItem(itemId);
      }
    }, this.controlRecoveryFrame);
  }

  /** Focuses the row with the tab stop, and returns `false` when there's none. */
  public focusTabStop(event?: Event): boolean {
    const tabbableItemId = selectors.tabbableItemId(this.store.state);
    if (tabbableItemId == null) {
      return false;
    }
    this.focusItem(tabbableItemId, event);
    return true;
  }

  /** Focuses a row. `event` is the keydown or press that moves focus, when there's one. */
  public focusItem = (itemId: TreeItemId, event?: Event) => {
    if (selectors.isItemFocusTarget(this.store.state, itemId)) {
      // The keyboard can move faster than a group expands: put the row in its final
      // place first, so it keeps focus once the transition ends.
      if (getHighlightReason(event) === REASONS.keyboard) {
        this.store.expansion.settleItem(itemId);
      }
      const element = this.store.items.getItemDOMElement(itemId);
      if (element) {
        // The viewport brings the focused row into view (see `revealItem`).
        this.focusElement(element, event);
      }
    }
  };

  /**
   * Focuses a row, or an element inside it such as a control or a cell, so the
   * row's focus handler reports `event` as the cause.
   */
  public focusElement(element: HTMLElement, event?: Event) {
    // Calling .focus() synchronously triggers the onFocus handler, which updates
    // focusedItemId and calls onItemHighlighted with the cause set here — but only
    // when focus actually moves. A no-op focus() on the already active element
    // fires no onFocus event, so setting the cause would leave it stale for the
    // next genuine focus.
    if (element !== activeElement(ownerDocument(element))) {
      this.focusCause = event;
      const previousFocusedItemId = this.store.state.focusedItemId;
      element.focus({ preventScroll: true });
      // The viewport reveals a row when focus moves to another one. Focus coming
      // back to the row from inside it, such as from a control, keeps the same
      // focused item, so the row is revealed here, in case it was scrolled away.
      if (
        previousFocusedItemId != null &&
        this.store.state.focusedItemId === previousFocusedItemId &&
        this.store.items.getItemDOMElement(previousFocusedItemId) === element
      ) {
        this.store.items.revealItem(previousFocusedItemId);
      }
    }
  }

  public actions = {
    focusItem: (itemId: TreeItemId) => this.focusItem(itemId),
    getFocusedItemId: (): TreeItemId | null => selectors.focusedItemId(this.store.state),
  };

  /** Gives the tree the typeahead that its key handler sends typed keys to. */
  public registerTypeahead(typeahead: TreeTypeahead) {
    this.typeahead = typeahead;
    return () => {
      if (this.typeahead === typeahead) {
        this.typeahead = null;
        this.typing = false;
      }
    };
  }

  /** Called by the typeahead as a search starts and ends. */
  public readonly setTyping = (typing: boolean) => {
    this.typing = typing;
  };

  /** Focuses the row in view at `index`, which the typed keys matched. */
  public readonly handleTypeaheadMatch = (index: number, event: React.KeyboardEvent) => {
    // The key did something, so it doesn't also trigger a shortcut outside the tree.
    stopEvent(event);
    const itemId = selectors.flatList(this.store.state)[index];
    this.focusItem(itemId, event.nativeEvent);
    // A held Shift types an uppercase letter here, so the selection still follows.
    if (this.store.state.multiple === 'opt-in') {
      this.store.selection.moveTo(itemId, REASONS.listNavigation, event.nativeEvent);
    }
  };

  private handleKeyDown(event: React.KeyboardEvent, itemId: TreeItemId) {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    const key = event.key;
    const { multiple } = this.store.state;
    const mac = platform.os.mac;
    // With multiple selection, Option+Space toggles the focused item on macOS, which
    // reserves Ctrl+Space and Cmd+Space. Option+Space types a non-breaking space, so
    // the physical key is matched.
    const macToggle =
      mac &&
      multiple !== false &&
      event.altKey &&
      !ctrlPressed &&
      event.nativeEvent.code === 'Space';
    const verticalArrow = key === 'ArrowDown' || key === 'ArrowUp';
    // With `multiple="opt-in"`, Ctrl+Arrow moves focus without moving the selection.
    // macOS reserves Ctrl+Arrow, so Option+Arrow does it there.
    const moveFocusOnly =
      verticalArrow &&
      multiple === 'opt-in' &&
      !event.shiftKey &&
      (mac ? event.altKey && !ctrlPressed : ctrlPressed && !event.altKey);
    // Alt on any key, and Ctrl/Cmd on an arrow, are left to the browser unless
    // they make one of the gestures above.
    const arrow = verticalArrow || key === 'ArrowLeft' || key === 'ArrowRight';
    if (!moveFocusOnly && ((event.altKey && !macToggle) || (ctrlPressed && arrow))) {
      return;
    }
    const isRtl = this.store.state.direction === 'rtl';
    const expandKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    // Ignore OS key auto-repeat for the activation keys so holding Space/Enter
    // doesn't rapidly re-toggle selection or expansion. Navigation keys (arrows,
    // typeahead) are intentionally left repeatable below.
    if (event.repeat && (key === ' ' || key === 'Enter' || macToggle)) {
      event.preventDefault();
      return;
    }

    // Select the item when pressing "Space" — unless a typeahead is in progress,
    // where an unmodified Space belongs to a multi-word label ("New Folder") and
    // falls through to the typeahead branch below. Ctrl+Space, and Shift+Space with
    // multiple selection, never type.
    const modifiedSpace = ctrlPressed || (event.shiftKey && multiple !== false);
    if (macToggle || (key === ' ' && (modifiedSpace || !this.typing))) {
      this.activateItem(itemId, event, ctrlPressed, macToggle);
      // Even on an item that can't be selected, so the page doesn't scroll.
      event.preventDefault();
    } else if (key === 'Enter' && this.store.items.getItemKind(itemId) !== 'link') {
      // A link item follows its link on Enter like any focused link, and the
      // click that follows selects it.
      if (this.store.expansion.toggleItemExpansion(itemId, REASONS.itemPress, event.nativeEvent)) {
        event.preventDefault();
      } else if (
        !this.activateItem(itemId, event, ctrlPressed) &&
        !selectors.isItemDisabled(this.store.state, itemId)
      ) {
        // Without another action, Enter follows the item's link, as on a link
        // that has focus itself. A disabled item doesn't forward it.
        const link = this.store.grid?.getLink(itemId);
        if (link != null) {
          event.preventDefault();
          link.click();
        }
      }
    } else if (verticalArrow) {
      event.preventDefault();
      const targetItem = (key === 'ArrowDown' ? getNextNavigableItem : getPreviousNavigableItem)(
        this.store.state,
        itemId,
      );
      if (targetItem != null) {
        this.navigateTo(targetItem, event);
        // Shift extends the range from the item focus left.
        if (multiple && event.shiftKey) {
          this.store.selection.extendTo(
            targetItem,
            itemId,
            REASONS.listNavigation,
            event.nativeEvent,
          );
        }
      }
    } else if (key === expandKey) {
      const expanded = selectors.isItemExpanded(this.store.state, itemId);
      if (!expanded && this.store.expansion.canToggleItemExpansion(itemId)) {
        this.store.expansion.setItemExpansion(
          itemId,
          true,
          REASONS.listNavigation,
          event.nativeEvent,
        );
      } else if (!this.store.grid?.focusFirstStop(itemId) && expanded) {
        const firstFocusableChild = getFirstNavigableChild(this.store.state, itemId);
        if (firstFocusableChild != null) {
          this.navigateTo(firstFocusableChild, event);
        }
      }
      event.preventDefault();
    } else if (key === collapseKey) {
      if (
        this.store.expansion.canToggleItemExpansion(itemId) &&
        selectors.isItemExpanded(this.store.state, itemId)
      ) {
        this.store.expansion.setItemExpansion(
          itemId,
          false,
          REASONS.listNavigation,
          event.nativeEvent,
        );
      } else {
        const parent = selectors.itemParentId(this.store.state, itemId);
        if (parent != null) {
          this.navigateTo(parent, event);
        }
      }
      event.preventDefault();
    } else if (key === 'Home' || key === 'End') {
      const edgeItem = (key === 'Home' ? getFirstNavigableItem : getLastNavigableItem)(
        this.store.state,
      );
      if (edgeItem != null) {
        // The range skips the rows that can't be selected, the focused one included.
        if (!this.store.state.disabled && multiple && ctrlPressed && event.shiftKey) {
          this.store.selection.selectRangeTo(
            itemId,
            edgeItem,
            REASONS.listNavigation,
            event.nativeEvent,
          );
        }
        this.navigateTo(edgeItem, event);
      }
      event.preventDefault();
    } else if ((key === 'PageDown' || key === 'PageUp') && !ctrlPressed && !event.shiftKey) {
      // Moves by as many rows as the scroll container shows, stopping at the
      // first or last row.
      const pageSize = this.store.items.getPageSize(itemId);
      if (pageSize > 0) {
        const step = key === 'PageDown' ? getNextNavigableItem : getPreviousNavigableItem;
        let targetItem = itemId;
        for (let i = 0; i < pageSize; i += 1) {
          const nextItem = step(this.store.state, targetItem);
          if (nextItem == null) {
            break;
          }
          targetItem = nextItem;
        }
        this.navigateTo(targetItem, event);
        event.preventDefault();
      }
    } else if (key === '*') {
      this.store.expansion.expandAllSiblings(itemId, REASONS.listNavigation, event.nativeEvent);
      event.preventDefault();
    } else if (
      ctrlPressed &&
      multiple &&
      // On a layout without Latin letters, the key in the position of A selects everything.
      (key === 'a' || key === 'A' || (event.nativeEvent.code === 'KeyA' && !/^[a-z]$/i.test(key)))
    ) {
      this.store.selection.selectAll(REASONS.listNavigation, event.nativeEvent);
      event.preventDefault();
    }

    // A held Shift (used to type uppercase letters) must not disqualify a
    // printable-character keypress. Only real modifier combos (ctrl/meta, and
    // alt which is handled at the top of this method) are excluded.
    //
    // A Space reaches here only mid-query, where it is the separator in a
    // multi-word label ("New Folder"); an idle Space was taken as selection above.
    else if (!ctrlPressed && (isPrintableKey(key) || key === ' ')) {
      // With a filter input, typing on a row continues the query instead: focus
      // moves before the key's default action, which then types into the input.
      if (isPrintableKey(key) && this.store.filtering?.focusInput()) {
        return;
      }
      // The hook only reports a search start with `stopTypingKeys`, which the tree leaves off.
      this.typing = true;
      this.typeahead?.onKeyDown(event);
    }
  }

  /**
   * Selects the item with Space or Enter, and returns whether it can be selected. As
   * on a button, a keydown whose default was prevented doesn't activate it.
   */
  private activateItem(
    itemId: TreeItemId,
    event: React.KeyboardEvent,
    ctrlPressed: boolean,
    macToggle = false,
  ) {
    if (!selectors.canItemBeSelected(this.store.state, itemId)) {
      return false;
    }
    if (event.defaultPrevented) {
      return true;
    }
    event.preventDefault();
    // A click on a link item would follow the link, and a click can't carry
    // Option+Space's toggle, so those select from the key.
    if (macToggle || this.store.items.getItemKind(itemId) === 'link') {
      this.store.selection.press(
        itemId,
        { shiftKey: event.shiftKey, ctrlKey: ctrlPressed || macToggle },
        REASONS.itemPress,
        event.nativeEvent,
      );
      return true;
    }
    // Otherwise the key presses the row through its click, as on a button, so the
    // item's `onClick` runs first and can call `preventBaseUIHandler()`.
    const element = this.store.items.getItemDOMElement(itemId);
    if (element != null) {
      this.keyboardClick = true;
      try {
        dispatchClickWithModifiers(element, event);
      } finally {
        this.keyboardClick = false;
      }
    }
    return true;
  }

  /** Moves focus to an item the keyboard navigated to, and the selection with it. */
  private navigateTo(itemId: TreeItemId, event: React.KeyboardEvent) {
    this.focusItem(itemId, event.nativeEvent);
    this.moveSelectionWithFocus(itemId, event);
  }

  /**
   * Moves the selection to an item the keyboard moved focus to, with `multiple="opt-in"`,
   * unless a modifier asked to move focus only.
   */
  public moveSelectionWithFocus(itemId: TreeItemId, event: React.KeyboardEvent) {
    const ctrlPressed = event.ctrlKey || event.metaKey;
    if (
      this.store.state.multiple === 'opt-in' &&
      !event.shiftKey &&
      !ctrlPressed &&
      !event.altKey
    ) {
      this.store.selection.moveTo(itemId, REASONS.listNavigation, event.nativeEvent);
    }
  }

  private getItemIdFromEvent(event: React.SyntheticEvent): TreeItemId | null {
    const itemKey = (event.currentTarget as HTMLElement).getAttribute(ITEM_KEY_ATTRIBUTE);
    if (itemKey == null) {
      return null;
    }
    return selectors.itemMetaLookup(this.store.state)[itemKey]?.id ?? null;
  }

  /**
   * Keeps the row from handling a click on its expansion trigger. Inside a link
   * item, the trigger is a `<span>`, which the row can't tell from its own content.
   */
  public claimTriggerClick(event: Event): void {
    this.triggerClick = event;
  }

  /**
   * Whether the event comes from interactive content of the row, such as a registered
   * control, which owns it: it doesn't select, expand, or sort the item.
   */
  private isEventFromInteractiveDescendant(event: React.SyntheticEvent): boolean {
    if (event.nativeEvent === this.triggerClick) {
      return true;
    }
    const target = getTarget(event.nativeEvent);
    const row = event.currentTarget as Element;
    const itemKey = row.getAttribute(ITEM_KEY_ATTRIBUTE);
    return (
      isElement(target) &&
      isWithinInteractiveContent(
        target,
        row,
        (node) => this.store.grid?.findControl(itemKey, node) != null,
      )
    );
  }

  /**
   * Whether the event bubbled through the row from content rendered outside it,
   * such as a portaled popup, which the row doesn't own.
   */
  private isEventFromOutsideItem(event: React.SyntheticEvent): boolean {
    const target = getTarget(event.nativeEvent);
    return isElement(target) && !contains(event.currentTarget as Element, target);
  }

  /**
   * Whether a row event belongs to other content: rendered outside the row, or
   * inside a control or nested widget, including a nested Tree's row.
   */
  public isEventForeignToItem(event: React.SyntheticEvent): boolean {
    return this.isEventFromOutsideItem(event) || this.isEventFromInteractiveDescendant(event);
  }

  /** Whether a press on a link item opens it in a new tab or window, as modifier keys do. */
  private isBrowserLinkPress(itemId: TreeItemId, event: React.MouseEvent): boolean {
    return (
      this.store.items.getItemKind(itemId) === 'link' &&
      (event.shiftKey || event.ctrlKey || event.metaKey)
    );
  }

  private readonly handleItemFocus = (event: React.FocusEvent) => {
    const itemId = this.getItemIdFromEvent(event);
    if (itemId == null || this.isEventFromOutsideItem(event)) {
      return;
    }
    const cause = this.focusCause ?? event.nativeEvent;
    // A focus event consumes the pending cause even when focus only moved from
    // a control back to its existing row. Otherwise that press leaks into the
    // next item reached with the keyboard.
    this.focusCause = undefined;

    if (
      selectors.canItemBeFocused(this.store.state, itemId) &&
      this.store.state.focusedItemId !== itemId
    ) {
      this.focusHandover = null;
      this.store.set('focusedItemId', itemId);
      this.store.context.onItemHighlighted?.(
        itemId,
        createGenericEventDetails(getHighlightReason(cause), cause),
      );
    }
  };

  /**
   * Reports the focus a press moves as `pointer`. Cleared after the event
   * turn, since a press can move no focus at all (a row that already has it, a
   * disabled control, a prevented default), and the next focus, such as
   * tabbing back into the tree, would then be misreported as a press.
   */
  private setPressFocusCause(event: MouseEvent): void {
    this.focusCause = event;
    this.store.timeoutManager.start('press-focus-reason', 0, () => {
      if (this.focusCause === event) {
        this.focusCause = undefined;
      }
    });
  }

  private readonly handleItemMouseDown = (event: React.MouseEvent) => {
    const itemId = this.getItemIdFromEvent(event);
    if (itemId == null || this.isEventFromOutsideItem(event)) {
      return;
    }
    const itemDisabled = selectors.isItemDisabled(this.store.state, itemId);

    // `mousedown` fires before the native focus event, so record the press
    // here. Setting it in `onClick` (which runs after focus) would be too late
    // for `onItemHighlighted`. Native focus on a nested Tree control bubbles
    // through the row too.
    //
    // Not for a disabled row: the press below is `preventDefault`ed, so no focus
    // follows it, and the latched press would then be read by whatever moved
    // focus next — tabbing to another row reported `pointer`.
    if (!itemDisabled) {
      this.setPressFocusCause(event.nativeEvent);
    }

    const fromInteractiveDescendant = this.isEventFromInteractiveDescendant(event);
    // The tree can't track focus inside a row that can't be focused, so a press
    // focuses nothing in it, not even a control that stays focusable while disabled.
    if (itemDisabled && !selectors.canItemBeFocused(this.store.state, itemId)) {
      event.preventDefault();
    }
    // The control, or the label editor's input, owns its press, such as a
    // shift-click selecting text.
    if (fromInteractiveDescendant) {
      return;
    }

    // On a link, modifier keys open it in a new tab or window instead.
    const hasModifier =
      (event.shiftKey || event.ctrlKey || event.metaKey) && !this.isBrowserLinkPress(itemId, event);

    // Prevent text selection when using modifier keys for multi-select.
    // Also prevent default for disabled items to avoid browser focus.
    if (hasModifier || itemDisabled) {
      event.preventDefault();
    }

    // preventDefault above blocks the browser's native focus. For a modifier
    // click that is the first interaction with the tree, that would leave DOM
    // focus outside the tree while the store points at this item, so arrow keys
    // keep firing on the previously focused element. Imperatively move focus
    // into the tree so keyboard navigation works. Only do this when focus isn't
    // already within the tree.
    if (hasModifier && selectors.canItemBeFocused(this.store.state, itemId)) {
      const rootElement = this.store.context.rootRef.current;
      if (rootElement != null) {
        const active = activeElement(ownerDocument(rootElement));
        const itemElement = this.store.items.getItemDOMElement(itemId);
        if (active !== itemElement) {
          (itemElement ?? rootElement).focus();
        }
      }
    }
  };

  public readonly rootEventHandlers = {
    onFocus: (event: React.FocusEvent) => {
      // Only handle focus if it's on the root element itself (not bubbled from
      // children), and give it to the row that carries the tab stop.
      if (getTarget(event.nativeEvent) !== event.currentTarget) {
        return;
      }
      const tabbableId = selectors.tabbableItemId(this.store.state);
      if (tabbableId != null) {
        this.focusItem(tabbableId);
      }
    },
    onBlur: (event: React.FocusEvent) => {
      // Check if focus moved outside the tree entirely. The row that had focus
      // keeps the tab stop, so tabbing back in returns to it.
      const rootElement = this.store.context.rootRef.current;
      if (rootElement && !contains(rootElement, event.relatedTarget as Element)) {
        // Typing after coming back starts a new search.
        this.typeahead?.endSession();
        const focusedItemId = this.store.state.focusedItemId;
        this.store.update({
          focusedItemId: null,
          lastFocusedItemId: focusedItemId ?? this.store.state.lastFocusedItemId,
        });
        if (focusedItemId != null) {
          this.store.context.onItemHighlighted?.(
            undefined,
            createGenericEventDetails(REASONS.none, event.nativeEvent),
          );
        }
      }
    },
    onKeyDown: (event: MaybeBaseUIEvent<React.KeyboardEvent>) => {
      // A row or control handler that calls `preventBaseUIHandler()` opts out of
      // the tree's handling, which is delegated to the root.
      if (event.baseUIHandlerPrevented) {
        return;
      }
      const target = getTarget(event.nativeEvent);
      if (!isElement(target) || this.handleExpansionAction(event, target)) {
        return;
      }
      const focusedId = this.store.state.focusedItemId;
      if (focusedId == null) {
        return;
      }
      const itemElement = this.store.items.getItemDOMElement(focusedId);
      if (target === itemElement) {
        this.handleKeyDown(event, focusedId);
        return;
      }
      // In a grid, registered controls share the row's navigation keys. Anything
      // else, such as popups rendered from the row or unregistered elements, keeps
      // all of its keys.
      if (
        itemElement != null &&
        contains(itemElement, target) &&
        this.store.grid?.handleControlKeyDown(event, focusedId, itemElement, target)
      ) {
        this.handleKeyDown(event, focusedId);
      }
    },
  };

  /**
   * Handles the Expand and Collapse actions of TalkBack, which Chrome sends to a row as
   * an Arrow Right or Arrow Left key press without focusing it, whatever the text
   * direction. A key press from a keyboard goes to the focused element, so one on a
   * row that doesn't have focus is such an action. On the focused row, the two can't
   * be told apart, so the keys follow the text direction there.
   */
  private handleExpansionAction(event: React.KeyboardEvent, target: Element): boolean {
    if (
      (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return false;
    }
    const itemKey = target.getAttribute(ITEM_KEY_ATTRIBUTE);
    if (itemKey == null || target === activeElement(ownerDocument(target))) {
      return false;
    }
    const itemId = selectors.itemMetaLookup(this.store.state)[itemKey]?.id;
    // A nested tree's row is handled by its own root.
    if (itemId == null || this.store.items.getItemDOMElement(itemId) !== target) {
      return false;
    }
    event.preventDefault();
    const expand = event.key === 'ArrowRight';
    if (
      this.store.expansion.canToggleItemExpansion(itemId) &&
      selectors.isItemExpanded(this.store.state, itemId) !== expand
    ) {
      this.store.expansion.setItemExpansion(
        itemId,
        expand,
        REASONS.listNavigation,
        event.nativeEvent,
      );
    }
    // Focus follows the screen reader to the row, unless it is outside the tree, such
    // as in a filter input.
    const rootElement = this.store.context.rootRef.current;
    if (rootElement != null && this.getFocusLocation(rootElement) !== 'outside') {
      this.focusItem(itemId, event.nativeEvent);
    }
    return true;
  }

  private readonly handleItemPointerDown = (event: React.PointerEvent): void => {
    this.lastPointerType = event.pointerType;
  };

  private readonly handleItemClick = (event: React.MouseEvent): void => {
    // A touch tap is a click made by a pointer (`detail` counts its presses) after a
    // touch press. A click from the keyboard or assistive technology isn't one.
    const touch = this.lastPointerType === 'touch' && event.detail > 0;
    this.lastPointerType = null;
    if (this.isEventFromOutsideItem(event) || this.isEventFromInteractiveDescendant(event)) {
      return;
    }
    const itemId = this.getItemIdFromEvent(event);
    if (itemId == null) {
      return;
    }
    // The link opens in a new tab or window, so the tree stays as it is.
    if (this.isBrowserLinkPress(itemId, event)) {
      return;
    }
    const kind = this.store.items.getItemKind(itemId);
    const { multiple } = this.store.state;
    const ctrlKey = event.ctrlKey || event.metaKey;
    const pressed = this.store.selection.press(
      itemId,
      { shiftKey: event.shiftKey, ctrlKey, touch },
      REASONS.itemPress,
      event.nativeEvent,
    );
    // A Shift or Ctrl/Cmd click edits the selection without also expanding the item.
    if (pressed && multiple && (event.shiftKey || ctrlKey)) {
      return;
    }

    // The second click of a double-click must not toggle the row straight back.
    // A link item's click navigates instead. Space only selects, and Enter tried
    // to expand before it clicked.
    if (
      this.store.state.expandOnClick &&
      kind !== 'link' &&
      event.detail <= 1 &&
      !this.keyboardClick
    ) {
      this.store.expansion.toggleItemExpansion(itemId, REASONS.itemPress, event.nativeEvent);
    }
  };

  public readonly itemEventHandlers = {
    onMouseDown: this.handleItemMouseDown,
    onPointerDown: this.handleItemPointerDown,
    onClick: this.handleItemClick,
    onFocus: this.handleItemFocus,
  };
}
