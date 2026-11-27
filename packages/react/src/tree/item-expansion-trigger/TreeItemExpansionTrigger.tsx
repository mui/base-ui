'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { REASONS } from '../../internals/reasons';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeLinkItemContext } from '../link-item/TreeLinkItemContext';
import { expansionMapping } from '../utils/stateAttributesMapping';

/**
 * A button that toggles the expansion state of a tree item.
 * Alt-click (Option-click on macOS) toggles its descendants too.
 * Renders a `<button>` element when the item can be expanded.
 * In a link item, renders a `<span>` that only handles clicks, since a link
 * can't contain a button. Keyboard users expand the item with the arrow keys.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemExpansionTrigger = fastComponentRef(function TreeItemExpansionTrigger(
  componentProps: TreeItemExpansionTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
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
  const inLink = React.useContext(TreeLinkItemContext);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: TreeItemExpansionTrigger.State = { expanded, disabled };

  const pressProps = {
    // Keep pointer focus on the row that owns the roving tab stop.
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault();
      store.interaction.focusItem(itemId, event.nativeEvent);
    },
    onClick: (event: React.MouseEvent) => {
      if (inLink) {
        // The click would also follow the link, and the row can't tell the span
        // from its own content.
        event.preventDefault();
        store.interaction.claimTriggerClick(event.nativeEvent);
        // A disabled button gets no click, but the span does.
        if (disabled) {
          return;
        }
      }
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
  };

  // The label names what a press does, and the row carries `aria-expanded`.
  // Setting it here too would announce the state twice: "Collapse Documents, expanded".
  const ariaLabel = expanded ? `Collapse ${label}` : `Expand ${label}`;

  // A link can't contain a button, so inside one the trigger is a plain `<span>`
  // with no role or name, as in the WAI-ARIA navigation tree example. Screen readers
  // can't reach it, so a touch screen reader user's tap follows the link and can't
  // expand the item. The APG accepts that gap:
  // https://github.com/w3c/aria-practices/issues/2577
  return useRenderElement(inLink ? 'span' : 'button', componentProps, {
    state,
    ref: inLink ? forwardedRef : [forwardedRef, buttonRef],
    props: [
      inLink
        ? pressProps
        : getButtonProps({ 'aria-label': ariaLabel, tabIndex: -1, ...pressProps }),
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
