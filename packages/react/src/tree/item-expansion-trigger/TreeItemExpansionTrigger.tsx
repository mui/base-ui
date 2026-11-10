'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { REASONS } from '../../internals/reasons';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { expansionMapping } from '../utils/stateAttributesMapping';

/**
 * A button that toggles the expansion state of a tree item.
 * Alt-click (Option-click on macOS) toggles its descendants too.
 * Renders a `<button>` element when the item can be expanded.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemExpansionTrigger = fastComponentRef(function TreeItemExpansionTrigger(
  componentProps: TreeItemExpansionTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    render,
    nativeButton = true,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const expanded = store.useState('isItemExpanded', itemId);
  const expandable = store.useState('isItemExpandable', itemId);
  // Match the row's behavior: a resolved-disabled item can't toggle expansion.
  const disabled = store.useState('isItemDisabled', itemId) || disabledProp;
  const label = store.useState('itemLabel', itemId);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: TreeItemExpansionTrigger.State = { expanded, disabled };

  // The label names what a press does, and the row carries `aria-expanded`.
  // Setting it here too would announce the state twice: "Collapse Documents, expanded".
  const ariaLabel = expanded ? `Collapse ${label}` : `Expand ${label}`;

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      getButtonProps({
        'aria-label': ariaLabel,
        tabIndex: -1,
        // Keep pointer focus on the row that owns the roving tab stop.
        onPointerDown: (event: React.PointerEvent) => {
          event.preventDefault();
          store.interaction.focusItem(itemId, REASONS.itemPress, event.nativeEvent);
        },
        onClick: (event: React.MouseEvent) => {
          // Alt-click (Option-click on macOS) also toggles the descendants, as in
          // VS Code. It has no keyboard equivalent on purpose: Finder's
          // Option+Arrow would clash with Alt+Arrow keyboard reordering, and
          // Alt+Left/Right navigates back and forward on Windows and Linux.
          const toggle = event.altKey
            ? store.expansion.toggleSubtreeExpansion
            : store.expansion.toggleItemExpansion;
          toggle(itemId, REASONS.triggerPress, event.nativeEvent);
          if (!store.expansion.isPropagationAllowed(event.nativeEvent)) {
            event.stopPropagation();
          }
        },
      }),
      elementProps,
    ],
    stateAttributesMapping: expansionMapping,
    enabled: expandable,
  });
});

export interface TreeItemExpansionTriggerState {
  /**
   * Whether the item is currently expanded.
   */
  expanded: boolean;
  /**
   * Whether the trigger is disabled, on its own or because its item or the tree is.
   */
  disabled: boolean;
}

export interface TreeItemExpansionTriggerProps
  extends NativeButtonProps, BaseUIComponentProps<'button', TreeItemExpansionTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * The trigger is also disabled while its item or the tree is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace TreeItemExpansionTrigger {
  export type State = TreeItemExpansionTriggerState;
  export type Props = TreeItemExpansionTriggerProps;
}
