import type * as React from 'react';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { activeElement, contains, getTarget } from '@base-ui/utils/shadowDom';
import { ownerDocument } from '@base-ui/utils/owner';
import { isElement } from '@floating-ui/utils/dom';
import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import type { ReasonToEvent } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { TYPEAHEAD_RESET_MS } from '../../internals/constants';
import type { MaybeBaseUIEvent } from '../../internals/types';
import type {
  TreeItemId,
  TreeRootHighlightEventReason,
  TreeSelectionMode,
  TreeDefaultItem,
  TreeState,
} from '../store/types';

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

let typeaheadCollator: Intl.Collator | undefined;

/**
 * Whether `label` starts with `query`, ignoring case, accents, and punctuation in the
 * runtime's locale, as `Tree.useFilter()` and the Combobox filter match. Inlined so a tree
 * without `Tree.FilterProvider` doesn't bundle the filter's matchers.
 */
function labelStartsWith(label: string, query: string): boolean {
  typeaheadCollator ??= new Intl.Collator(undefined, {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
  });
  return typeaheadCollator.compare(label.slice(0, query.length), query) === 0;
}

function isPrintableKey(key: string): boolean {
  return key.length === 1 && !!key.match(/\S/);
}

export class TreeInteractionPlugin<TItem = TreeDefaultItem> {
  declare private store: TreeStore<TreeSelectionMode | undefined, TItem>;

  /**
   * What moves focus next: the reason, and the keydown or press behind it when
   * there is one. `none` when nothing the tree saw caused it, such as tabbing
   * into the tree or focus recovery.
   */
  private lastFocusCause: FocusCause = { reason: REASONS.none };

  private typeaheadQuery = '';

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

  constructor(store: TreeStore<TreeSelectionMode | undefined, TItem>) {
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
      // Focus is outside the tree, so the removed row's tab stop goes to the
      // neighbor that would have taken focus.
      const lastFocusedId = newState.lastFocusedItemId;
      if (
        lastFocusedId != null &&
        newMetaLookup[getItemIdKey(lastFocusedId)] == null &&
        previousMetaLookup[getItemIdKey(lastFocusedId)] != null
      ) {
        this.store.set(
          'lastFocusedItemId',
          this.getRemovedItemSuccessor(newState, previousState, lastFocusedId),
        );
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

  public focusItem = (
    itemId: TreeItemId,
    reason: TreeRootHighlightEventReason = REASONS.none,
    event?: FocusCause['event'],
  ) => {
    if (selectors.isItemFocusTarget(this.store.state, itemId)) {
      const element = this.store.items.getItemDOMElement(itemId);
      if (element) {
        // The viewport brings the focused row into view (see `revealItem`).
        this.focusElement(element, reason, event);
      }
    }
  };

  /**
   * Focuses a row, or an element inside it such as a control or a cell, so the
   * row's focus handler reports `reason`.
   */
  public focusElement(
    element: HTMLElement,
    reason: TreeRootHighlightEventReason,
    event?: FocusCause['event'],
  ) {
    // Calling .focus() synchronously triggers the onFocus handler, which updates
    // focusedItemId and calls onItemHighlighted with the cause set here — but only
    // when focus actually moves. A no-op focus() on the already active element
    // fires no onFocus event, so setting the reason would leave it stale for the
    // next genuine focus.
    if (element !== activeElement(ownerDocument(element))) {
      this.lastFocusCause = { reason, event };
      element.focus({ preventScroll: true });
    }
  }

  public actions = {
    focusItem: (itemId: TreeItemId) => this.focusItem(itemId, REASONS.imperativeAction),
    getFocusedItemId: (): TreeItemId | null => selectors.focusedItemId(this.store.state),
  };

  private getFirstItemMatchingTypeaheadQuery(
    itemId: TreeItemId,
    newKey: string,
  ): TreeItemId | null {
    const state = this.store.state;
    const flatList = selectors.flatList(state);
    const n = flatList.length;

    // If the focused item isn't in the visible list (e.g. collapsed ancestor),
    // start from 0 and let the full-wrap loop cover everything.
    const currentIndex = selectors.flatListIndex(state, itemId);
    const base = currentIndex === -1 ? 0 : currentIndex;

    const findMatch = (query: string, startOffset: number): TreeItemId | null => {
      for (let i = 0; i < n; i += 1) {
        const idx = (base + startOffset + i) % n;
        const id = flatList[idx];
        if (
          labelStartsWith(selectors.itemLabel(state, id), query) &&
          selectors.canItemBeFocused(state, id)
        ) {
          return id;
        }
      }
      return null;
    };

    const concatenatedQuery = `${this.typeaheadQuery}${newKey}`;
    const concatenatedStartOffset = concatenatedQuery.length > 1 ? 0 : 1;
    const concatenatedMatch = findMatch(concatenatedQuery, concatenatedStartOffset);
    if (concatenatedMatch != null) {
      this.typeaheadQuery = concatenatedQuery;
      return concatenatedMatch;
    }

    if (concatenatedQuery !== newKey) {
      const singleKeyMatch = findMatch(newKey, 1);
      if (singleKeyMatch != null) {
        this.typeaheadQuery = newKey;
        return singleKeyMatch;
      }
    }

    this.typeaheadQuery = '';
    return null;
  }

  private handleKeyDown(event: React.KeyboardEvent, itemId: TreeItemId) {
    if (event.altKey) {
      return;
    }

    const ctrlPressed = event.ctrlKey || event.metaKey;
    const key = event.key;
    const isMulti = this.store.state.selectionMode === 'multiple';
    const isRtl = this.store.state.direction === 'rtl';
    const expandKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    // Ignore OS key auto-repeat for the activation keys so holding Space/Enter
    // doesn't rapidly re-toggle selection or expansion. Navigation keys (arrows,
    // typeahead) are intentionally left repeatable below.
    if (event.repeat && (key === ' ' || key === 'Enter')) {
      event.preventDefault();
      return;
    }

    // Select the item when pressing "Space" — unless a typeahead is in progress,
    // where the Space belongs to a multi-word label ("New Folder") and falls
    // through to the typeahead branch below.
    if (key === ' ' && this.typeaheadQuery === '') {
      // Always preventDefault, even for non-selectable items, so the page doesn't scroll.
      event.preventDefault();
      if (selectors.canItemBeSelected(this.store.state, itemId)) {
        if (isMulti && event.shiftKey) {
          this.store.selection.expandSelectionRange(itemId, REASONS.keyboard, event.nativeEvent);
        } else {
          // Activating a row is a press, whichever input does it.
          this.store.selection.setItemChecked(
            itemId,
            undefined,
            REASONS.itemPress,
            event.nativeEvent,
          );
        }
      }
    } else if (key === 'Enter' && this.store.items.getItemKind(itemId) !== 'link') {
      // A link item follows its link on Enter like any focused link, and the
      // click that follows selects it.
      if (this.store.expansion.toggleItemExpansion(itemId, REASONS.itemPress, event.nativeEvent)) {
        event.preventDefault();
      } else if (selectors.canItemBeSelected(this.store.state, itemId)) {
        if (isMulti) {
          event.preventDefault();
          this.store.selection.setItemSelection({
            itemId,
            keepExistingSelection: true,
            reason: REASONS.itemPress,
            event: event.nativeEvent,
          });
        } else if (!selectors.isItemSelected(this.store.state, itemId)) {
          this.store.selection.setItemSelection({
            itemId,
            reason: REASONS.itemPress,
            event: event.nativeEvent,
          });
          event.preventDefault();
        }
      } else if (!selectors.isItemDisabled(this.store.state, itemId)) {
        // Without another action, Enter follows the item's link, as on a link
        // that has focus itself. A disabled item doesn't forward it.
        const link = this.store.grid?.getLink(itemId);
        if (link != null) {
          event.preventDefault();
          link.click();
        }
      }
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      const targetItem = (key === 'ArrowDown' ? getNextNavigableItem : getPreviousNavigableItem)(
        this.store.state,
        itemId,
      );
      if (targetItem != null) {
        this.focusItem(targetItem, REASONS.keyboard, event.nativeEvent);
        if (isMulti && event.shiftKey) {
          this.store.selection.selectItemFromArrowNavigation(
            itemId,
            targetItem,
            REASONS.keyboard,
            event.nativeEvent,
          );
        }
      }
    } else if (key === expandKey) {
      if (ctrlPressed) {
        return;
      }
      const expanded = selectors.isItemExpanded(this.store.state, itemId);
      if (!expanded && this.store.expansion.canToggleItemExpansion(itemId)) {
        this.store.expansion.setItemExpansion(itemId, true, REASONS.keyboard, event.nativeEvent);
      } else if (!this.store.grid?.focusFirstStop(itemId) && expanded) {
        const firstFocusableChild = getFirstNavigableChild(this.store.state, itemId);
        if (firstFocusableChild != null) {
          this.focusItem(firstFocusableChild, REASONS.keyboard, event.nativeEvent);
        }
      }
      event.preventDefault();
    } else if (key === collapseKey) {
      if (ctrlPressed) {
        return;
      }
      if (
        this.store.expansion.canToggleItemExpansion(itemId) &&
        selectors.isItemExpanded(this.store.state, itemId)
      ) {
        this.store.expansion.setItemExpansion(itemId, false, REASONS.keyboard, event.nativeEvent);
      } else {
        const parent = selectors.itemParentId(this.store.state, itemId);
        if (parent != null) {
          this.focusItem(parent, REASONS.keyboard, event.nativeEvent);
        }
      }
      event.preventDefault();
    } else if (key === 'Home' || key === 'End') {
      const edgeItem = (key === 'Home' ? getFirstNavigableItem : getLastNavigableItem)(
        this.store.state,
      );
      if (edgeItem != null) {
        // The range skips the rows that can't be selected, the focused one included.
        if (!this.store.state.disabled && isMulti && ctrlPressed && event.shiftKey) {
          this.store.selection.selectRangeTo(itemId, edgeItem, REASONS.keyboard, event.nativeEvent);
        } else {
          this.focusItem(edgeItem, REASONS.keyboard, event.nativeEvent);
        }
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
        this.focusItem(targetItem, REASONS.keyboard, event.nativeEvent);
        event.preventDefault();
      }
    } else if (key === '*') {
      this.store.expansion.expandAllSiblings(itemId, REASONS.keyboard, event.nativeEvent);
      event.preventDefault();
    } else if (event.key.toUpperCase() === 'A' && ctrlPressed && isMulti) {
      this.store.selection.toggleSelectAll(REASONS.keyboard, event.nativeEvent);
      event.preventDefault();
    }

    // A held Shift (used to type uppercase letters) must not disqualify a
    // printable-character keypress. Only real modifier combos (ctrl/meta, and
    // alt which is handled at the top of this method) are excluded.
    //
    // A Space reaches here only mid-query, where it is the separator in a
    // multi-word label ("New Folder"); an idle Space was taken as selection above.
    else if (!ctrlPressed && (isPrintableKey(key) || (key === ' ' && this.typeaheadQuery !== ''))) {
      // With a filter input, typing on a row continues the query instead: focus
      // moves before the key's default action, which then types into the input.
      if (isPrintableKey(key) && this.store.filtering?.focusInput()) {
        return;
      }
      // A Space that ends up matching nothing must still not scroll the page.
      if (key === ' ') {
        event.preventDefault();
      }
      const matchingItem = this.getFirstItemMatchingTypeaheadQuery(itemId, key);
      if (matchingItem != null) {
        this.focusItem(matchingItem, REASONS.keyboard, event.nativeEvent);
        event.preventDefault();
      }

      this.store.timeoutManager.start('typeahead', TYPEAHEAD_RESET_MS, () => {
        this.typeaheadQuery = '';
      });
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

  private readonly handleItemFocus = (event: React.FocusEvent) => {
    const itemId = this.getItemIdFromEvent(event);
    if (itemId == null || this.isEventFromOutsideItem(event)) {
      return;
    }
    const { reason, event: cause } = this.lastFocusCause;
    // A focus event consumes the pending cause even when focus only moved from
    // a control back to its existing row. Otherwise that pointer reason leaks
    // into the next item reached with the keyboard.
    this.lastFocusCause = { reason: REASONS.none };

    if (
      selectors.canItemBeFocused(this.store.state, itemId) &&
      this.store.state.focusedItemId !== itemId
    ) {
      this.focusHandover = null;
      this.store.set('focusedItemId', itemId);
      this.store.context.onItemHighlighted?.(itemId, createGenericEventDetails(reason, cause));
    }
  };

  /**
   * Reports the focus a press moves as `item-press`. Cleared after the event
   * turn, since a press can move no focus at all (a row that already has it, a
   * disabled control, a prevented default), and the next focus, such as
   * tabbing back into the tree, would then be misreported as a press.
   */
  private setPressFocusCause(event: MouseEvent): void {
    this.lastFocusCause = { reason: REASONS.itemPress, event };
    this.store.timeoutManager.start('press-focus-reason', 0, () => {
      if (this.lastFocusCause.reason === REASONS.itemPress) {
        this.lastFocusCause = { reason: REASONS.none };
      }
    });
  }

  private readonly handleItemMouseDown = (event: React.MouseEvent) => {
    const itemId = this.getItemIdFromEvent(event);
    if (itemId == null || this.isEventFromOutsideItem(event)) {
      return;
    }
    const kind = this.store.items.getItemKind(itemId);
    const itemDisabled = selectors.isItemDisabled(this.store.state, itemId);

    // `mousedown` fires before the native focus event, so record the press
    // reason here. Setting it in `onClick` (which runs after focus) would make
    // `onItemHighlighted` report `keyboard` for a mouse click. Native focus on a
    // nested Tree control bubbles through the row too.
    //
    // Not for a disabled row: the press below is `preventDefault`ed, so no focus
    // follows it, and the latched reason would then be read by whatever moved
    // focus next — tabbing to another row reported `item-press`.
    if (!itemDisabled) {
      this.setPressFocusCause(event.nativeEvent);
    }

    // The control, or the label editor's input, owns its press, such as a
    // shift-click selecting text.
    if (this.isEventFromInteractiveDescendant(event)) {
      return;
    }

    // On a link, modifier keys open it in a new tab or window instead.
    const hasModifier = kind !== 'link' && (event.shiftKey || event.ctrlKey || event.metaKey);

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
      const focusedId = this.store.state.focusedItemId;
      // A row or control handler that calls `preventBaseUIHandler()` opts out of
      // the tree's handling, which is delegated to the root.
      if (focusedId == null || event.baseUIHandlerPrevented) {
        return;
      }
      const target = getTarget(event.nativeEvent);
      if (!isElement(target)) {
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

  private readonly handleItemClick = (event: React.MouseEvent): void => {
    if (this.isEventFromOutsideItem(event) || this.isEventFromInteractiveDescendant(event)) {
      return;
    }
    const itemId = this.getItemIdFromEvent(event);
    if (itemId == null) {
      return;
    }
    const kind = this.store.items.getItemKind(itemId);
    if (kind === 'link' && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      // The link opens in a new tab or window, so the tree stays as it is.
      return;
    }
    // Disabled items are never focused by mouse click, even when
    // itemFocusableWhenDisabled is true (that only affects keyboard focus).
    if (!selectors.isItemDisabled(this.store.state, itemId)) {
      this.store.set('focusedItemId', itemId);
    }

    if (selectors.canItemBeSelected(this.store.state, itemId)) {
      const isMulti = this.store.state.selectionMode === 'multiple';
      // A checkbox item toggles on any other click, so Ctrl or Cmd changes nothing.
      if (isMulti && (event.ctrlKey || event.metaKey) && kind !== 'checkbox') {
        this.store.selection.setItemSelection({
          itemId,
          keepExistingSelection: true,
          reason: REASONS.itemPress,
          event: event.nativeEvent,
        });
        return;
      }
      if (isMulti && event.shiftKey) {
        this.store.selection.expandSelectionRange(itemId, REASONS.itemPress, event.nativeEvent);
        return;
      }
      if (kind === 'checkbox') {
        // Like a click on `TreeGrid.RowCheckbox`.
        this.store.selection.setItemChecked(
          itemId,
          undefined,
          REASONS.itemPress,
          event.nativeEvent,
        );
      } else {
        this.store.selection.setItemSelection({
          itemId,
          shouldBeSelected: true,
          reason: REASONS.itemPress,
          event: event.nativeEvent,
        });
      }
    }

    // The second click of a double-click must not toggle the row straight back.
    // A link item's click navigates instead.
    if (this.store.state.expandOnClick && kind !== 'link' && event.detail <= 1) {
      this.store.expansion.toggleItemExpansion(itemId, REASONS.itemPress, event.nativeEvent);
    }
  };

  public readonly itemEventHandlers = {
    onMouseDown: this.handleItemMouseDown,
    onClick: this.handleItemClick,
    onFocus: this.handleItemFocus,
  };
}

interface FocusCause {
  reason: TreeRootHighlightEventReason;
  event?: ReasonToEvent<TreeRootHighlightEventReason> | undefined;
}
