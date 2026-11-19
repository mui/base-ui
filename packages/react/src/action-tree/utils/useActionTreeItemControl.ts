'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';
import { assertActionTree } from '../../tree/utils/assertTreeKind';
import type { ActionTreeItemControlKeys } from '../item-control/ActionTreeItemControl';

export const ACTION_CONTROL_KEYS: Required<ActionTreeItemControlKeys> = {
  horizontal: 'tree',
  vertical: 'tree',
  homeEnd: 'tree',
  escape: 'tree',
};

export const WIDGET_CONTROL_KEYS: Required<ActionTreeItemControlKeys> = {
  horizontal: 'control',
  vertical: 'control',
  homeEnd: 'control',
  escape: 'control',
};

export interface UseActionTreeItemControlParameters {
  /** The name of the part, for the error thrown outside `ActionTree.Root`. */
  part: string;
  /** The part a `Tree` renders instead, if any, for the same error. */
  treePart?: string | undefined;
  controlKeys?: ActionTreeItemControlKeys | undefined;
  /**
   * The keys the control keeps by default. A function is resolved on each key
   * press, so it can read the element's current attributes.
   */
  defaultKeys:
    | Required<ActionTreeItemControlKeys>
    | ((element: HTMLElement) => Required<ActionTreeItemControlKeys>);
  /**
   * Whether the control is disabled and can't receive focus, so navigation skips it.
   * A function reads the state from the element on each key press.
   */
  disabled?: boolean | ((element: HTMLElement) => boolean) | undefined;
}

export interface UseActionTreeItemControlReturnValue {
  /** Registers the control. Merge it with the element's other refs. */
  ref: React.RefCallback<HTMLElement>;
  /** `0` while the item holds the tab stop, so Tab walks its controls. */
  tabIndex: number;
}

/**
 * Registers a control rendered inside a grid item with the item's keyboard navigation.
 * Throws outside `ActionTree.Root`.
 */
export function useActionTreeItemControl(
  parameters: UseActionTreeItemControlParameters,
): UseActionTreeItemControlReturnValue {
  const { part, treePart, controlKeys, defaultKeys, disabled = false } = parameters;
  const store = useTreeRootContext();
  assertActionTree(store, part, treePart);
  const grid = store.grid;
  const itemId = useTreeItemContext();
  const tabbable = store.useState('isItemDefaultFocusable', itemId);

  const getKeys = useStableCallback((element: HTMLElement): Required<ActionTreeItemControlKeys> => {
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
      element == null
        ? undefined
        : grid.registerControl(
            itemId,
            element,
            () => getKeys(element),
            () => isDisabled(element),
          ),
    [grid, itemId, getKeys, isDisabled],
  );

  return { ref, tabIndex: tabbable ? 0 : -1 };
}
