import type * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { activeElement } from '@base-ui/utils/shadowDom';
import type { TreeDefaultItem, TreeItemId, TreeSelectionMode } from '../store/types';
import type { TreeStore } from '../store/TreeStore';
import { isControlFocusable, sortInComposedOrder } from '../utils/focusability';
import { getItemIdKey } from '../utils/itemIdKey';
import type { TreeItemControlKeys } from '../item-control/TreeItemControl';

interface RegisteredControl {
  element: HTMLElement;
  getKeys: () => Required<TreeItemControlKeys>;
  isDisabled: () => boolean;
}

const CONTROL_NAVIGATION_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Escape',
]);

/**
 * Whether a horizontal arrow moves the caret of a text field instead of leaving
 * it: the field has a selection, or its caret is away from the edge the arrow
 * moves toward. Inputs without a selection API, such as `email` and `number`,
 * never keep it.
 */
function keepsHorizontalArrow(element: Element, key: string): boolean {
  if (element.localName !== 'input' && element.localName !== 'textarea') {
    return false;
  }
  const { selectionStart, selectionEnd, value } = element as HTMLInputElement | HTMLTextAreaElement;
  if (selectionStart == null) {
    return false;
  }
  if (selectionStart !== selectionEnd) {
    return true;
  }
  // The caret follows the text's direction, which can differ from the tree's.
  const isRtl = ownerWindow(element).getComputedStyle(element).direction === 'rtl';
  const forward = key === (isRtl ? 'ArrowLeft' : 'ArrowRight');
  return forward ? selectionStart < value.length : selectionStart > 0;
}

/**
 * Lets the keyboard reach the controls inside the items, for `Tree.GridProvider`:
 * the arrows move between an item and its controls, and each control keeps the
 * keys it uses.
 */
export class TreeGridPlugin<TItem = TreeDefaultItem> {
  /** Adds the grid navigation to a store. Installed by `Tree.GridProvider`. */
  static install(store: TreeStore<any, any>) {
    if (store.grid == null) {
      store.grid = new TreeGridPlugin(store);
    }
  }

  declare private store: TreeStore<TreeSelectionMode | undefined, TItem>;

  /** Controls registered by the row parts, keyed by item. */
  private controls = new Map<string, Set<RegisteredControl>>();

  constructor(store: TreeStore<TreeSelectionMode | undefined, TItem>) {
    this.store = store;
  }

  /**
   * Registers a control rendered inside an item's row so the row's keyboard
   * navigation can reach it. Returns the cleanup that unregisters it, to run
   * from a ref cleanup.
   */
  public registerControl = (
    itemId: TreeItemId,
    element: HTMLElement,
    getKeys: () => Required<TreeItemControlKeys>,
    isDisabled: () => boolean,
  ): (() => void) => {
    const key = getItemIdKey(itemId);
    let itemControls = this.controls.get(key);
    if (itemControls == null) {
      itemControls = new Set();
      this.controls.set(key, itemControls);
    }
    const control: RegisteredControl = { element, getKeys, isDisabled };
    itemControls.add(control);

    return () => {
      itemControls.delete(control);
      if (itemControls.size === 0 && this.controls.get(key) === itemControls) {
        this.controls.delete(key);
      }
      // React detaches a ref before it removes the node, so a focused control
      // that unmounts or swaps its element (a retry button whose error
      // cleared) is still focused here. Once the node is gone, focus falls to
      // the document body.
      if (activeElement(ownerDocument(element)) === element) {
        this.store.interaction.recoverFocusFromRemovedControl(itemId);
      }
    };
  };

  /** The registration of `element` among an item's controls. The last registration wins. */
  public findControl(itemKey: string | null, element: Element): RegisteredControl | undefined {
    let control: RegisteredControl | undefined;
    for (const candidate of (itemKey == null ? null : this.controls.get(itemKey)) ?? EMPTY_ARRAY) {
      if (candidate.element === element) {
        control = candidate;
      }
    }
    return control;
  }

  /** The focusable registered controls of an item, in composed tree order. */
  private getControls(itemId: TreeItemId): RegisteredControl[] {
    const itemElement = this.store.items.getItemDOMElement(itemId);
    const itemControls = this.controls.get(getItemIdKey(itemId));
    if (itemElement == null || itemControls == null) {
      return [];
    }
    return sortInComposedOrder(
      itemElement,
      Array.from(itemControls).filter(
        (control) => !control.isDisabled() && isControlFocusable(control.element, itemElement),
      ),
    );
  }

  /** Focuses the first control of an item. Returns whether the item has one. */
  public focusFirstControl(itemId: TreeItemId): boolean {
    const controls = this.getControls(itemId);
    if (controls.length === 0) {
      return false;
    }
    this.focusControl(controls[0]);
    return true;
  }

  /** The link among an item's controls. */
  public getLink(itemId: TreeItemId): HTMLElement | undefined {
    return this.getControls(itemId).find(
      (control) => control.element.localName === 'a' && control.element.hasAttribute('href'),
    )?.element;
  }

  /**
   * Focuses a control without the browser's focus scroll, which scrolls every
   * ancestor. The list only scrolls rows into view vertically, so bring the
   * control into view horizontally.
   */
  private focusControl(control: RegisteredControl) {
    control.element.focus({ preventScroll: true });
    this.store.items.revealHorizontally(control.element);
  }

  /**
   * Keys pressed on a registered control. The control keeps every key it
   * declares as its own; the remaining navigation keys move through the row and
   * the tree. Modified keys always stay with the control and the browser.
   * Returns whether the row should handle the key as if pressed on itself.
   */
  public handleControlKeyDown(
    event: React.KeyboardEvent,
    itemId: TreeItemId,
    itemElement: HTMLElement,
    target: Element,
  ): boolean {
    if (!CONTROL_NAVIGATION_KEYS.has(event.key)) {
      return false;
    }
    // A disabled control that stays focusable prevents every key to block its
    // activation. Navigation keys still apply to it.
    const disabledFocusable = target.getAttribute('aria-disabled') === 'true';
    if (
      (event.defaultPrevented && !disabledFocusable) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return false;
    }

    const control = this.findControl(getItemIdKey(itemId), target);
    if (control == null) {
      return false;
    }
    // A disabled control can't act on any key, so the navigation keys move
    // focus away from it, including from one that stays focusable.
    const unavailable =
      disabledFocusable ||
      control.isDisabled() ||
      !isControlFocusable(control.element, itemElement);
    const keys: TreeItemControlKeys = unavailable ? {} : control.getKeys();
    const isRtl = this.store.state.direction === 'rtl';
    const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backwardKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    switch (event.key) {
      case forwardKey:
      case backwardKey: {
        if (
          keys.horizontal === 'control' ||
          (!unavailable && keepsHorizontalArrow(target, event.key))
        ) {
          return false;
        }
        event.preventDefault();
        const controls = this.getControls(itemId);
        const index = controls.indexOf(control);
        // Bounded: backward from the first control returns to the row, forward
        // from the last one stays put.
        if (event.key === backwardKey) {
          if (index > 0) {
            this.focusControl(controls[index - 1]);
          } else {
            itemElement.focus({ preventScroll: true });
          }
        } else if (index < controls.length - 1) {
          this.focusControl(controls[index + 1]);
        }
        return false;
      }
      case 'ArrowDown':
      case 'ArrowUp':
        // The row's own handling, as no modifier is held.
        return keys.vertical !== 'control';
      case 'Home':
      case 'End': {
        if (keys.homeEnd === 'control') {
          return false;
        }
        event.preventDefault();
        const controls = this.getControls(itemId);
        if (controls.length === 0) {
          itemElement.focus({ preventScroll: true });
        } else {
          this.focusControl(event.key === 'Home' ? controls[0] : controls[controls.length - 1]);
        }
        return false;
      }
      case 'Escape': {
        if (keys.escape === 'control') {
          return false;
        }
        // Consumed so an enclosing dialog stays open; Escape on the row itself
        // is left to the containing UI.
        event.preventDefault();
        event.stopPropagation();
        itemElement.focus({ preventScroll: true });
        return false;
      }
      default:
        return false;
    }
  }
}
