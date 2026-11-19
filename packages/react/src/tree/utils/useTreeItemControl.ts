'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { selectors } from '../store/selectors';
import { REASONS } from '../../internals/reasons';
import type { TreeItemControlKeys } from '../item-control/TreeItemControl';

export const ACTION_CONTROL_KEYS: Required<TreeItemControlKeys> = {
  horizontal: 'tree',
  vertical: 'tree',
  homeEnd: 'tree',
  escape: 'tree',
};

export const WIDGET_CONTROL_KEYS: Required<TreeItemControlKeys> = {
  horizontal: 'control',
  vertical: 'control',
  homeEnd: 'control',
  escape: 'control',
};

const isNeverTabbable = () => false;

export interface UseTreeItemControlParameters {
  controlKeys: TreeItemControlKeys | undefined;
  /**
   * The keys the control keeps by default. A function is resolved on each key
   * press, so it can read the element's current attributes.
   */
  defaultKeys:
    Required<TreeItemControlKeys> | ((element: HTMLElement) => Required<TreeItemControlKeys>);
  /**
   * Whether the control is disabled and can't receive focus, so navigation skips it.
   * A function reads the state from the element on each key press.
   */
  disabled?: boolean | ((element: HTMLElement) => boolean) | undefined;
}

export interface UseTreeItemControlReturnValue {
  /** Registers the control. Merge it with the element's other refs. */
  ref: React.RefCallback<HTMLElement>;
  /** `0` while the item holds the tab stop of a grid, so Tab walks its controls. */
  tabIndex: number;
  /**
   * Outside a grid, keeps the focus of a press, or of focus reaching the control another
   * way, on the item, since the control isn't a tab stop there. On `mousedown`, so a gesture starting on the control,
   * such as painting a selection, still receives a `pointerdown` that isn't canceled.
   */
  props: React.HTMLAttributes<HTMLElement>;
}

/**
 * Registers a control rendered inside a tree item with the item's keyboard navigation,
 * when the tree is a grid.
 */
export function useTreeItemControl(
  parameters: UseTreeItemControlParameters,
): UseTreeItemControlReturnValue {
  const { controlKeys, defaultKeys, disabled = false } = parameters;
  const store = useTreeRootContext();
  // Fixed for the lifetime of the store, as adding or removing the provider remounts the tree.
  const grid = store.grid;
  const itemId = useTreeItemContext();
  const tabbable = useStore(
    store,
    grid == null ? isNeverTabbable : selectors.isItemDefaultFocusable,
    itemId,
  );

  const getKeys = useStableCallback((element: HTMLElement): Required<TreeItemControlKeys> => {
    const defaults = typeof defaultKeys === 'function' ? defaultKeys(element) : defaultKeys;
    return {
      horizontal: controlKeys?.horizontal ?? defaults.horizontal,
      vertical: controlKeys?.vertical ?? defaults.vertical,
      homeEnd: controlKeys?.homeEnd ?? defaults.homeEnd,
      escape: controlKeys?.escape ?? defaults.escape,
    };
  });
  const isDisabled = useStableCallback((element: HTMLElement) =>
    typeof disabled === 'function' ? disabled(element) : disabled,
  );

  const ref = React.useCallback(
    (element: HTMLElement | null) =>
      element == null || grid == null
        ? undefined
        : grid.registerControl(
            itemId,
            element,
            () => getKeys(element),
            () => isDisabled(element),
          ),
    [grid, itemId, getKeys, isDisabled],
  );

  const props = React.useMemo(
    () =>
      grid == null
        ? {
            onMouseDown: (event: React.MouseEvent) =>
              store.interaction.focusItemOnPress(itemId, event),
            // Focus that bypasses the press, such as a click on an associated label,
            // would otherwise stay on a control the arrow keys ignore.
            onFocus: (event: React.FocusEvent) =>
              store.interaction.focusItem(itemId, REASONS.itemPress, event.nativeEvent),
          }
        : EMPTY_OBJECT,
    [grid, store, itemId],
  );

  return { ref, tabIndex: tabbable ? 0 : -1, props };
}
