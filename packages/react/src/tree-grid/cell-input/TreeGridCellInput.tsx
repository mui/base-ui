'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ACTION_CONTROL_KEYS, useTreeGridCellControl } from '../utils/useTreeGridCellControl';
import type { TreeGridCellControlKeys } from '../cell-control/TreeGridCellControl';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';

// Single-line fields don't use the vertical arrows, so those still move between items.
const SINGLE_LINE_TEXT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password']);
// Fields whose caret `selectionStart` exposes. Email and number fields hide it, so
// the tree can't tell when the caret reaches an edge, and they keep the arrows.
const CARET_TEXT_TYPES = new Set(['text', 'search', 'url', 'tel', 'password']);

function getInputControlKeys(element: HTMLElement): Required<TreeGridCellControlKeys> {
  const input = element as HTMLInputElement;
  // A disabled input that stays focusable ignores every key, so they all navigate.
  if (input.type === 'checkbox' || input.getAttribute('aria-disabled') === 'true') {
    return ACTION_CONTROL_KEYS;
  }
  const isInput = element.localName === 'input';
  // A `list` attribute attaches native suggestions, which the vertical arrows browse.
  const singleLineText =
    isInput && SINGLE_LINE_TEXT_TYPES.has(input.type) && !input.hasAttribute('list');
  // The tree leaves the horizontal arrows to a text field while they move its caret.
  const textField =
    element.localName === 'textarea' || (isInput && CARET_TEXT_TYPES.has(input.type));
  return {
    horizontal: textField ? 'tree' : 'control',
    vertical: singleLineText ? 'tree' : 'control',
    homeEnd: 'control',
    // A search field clears its value on Escape.
    escape: input.type === 'search' && input.value !== '' ? 'control' : 'tree',
  };
}

/**
 * An input inside a tree item that takes part in the item's keyboard navigation.
 * Requires `TreeGrid.Root`.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridCellInput = fastComponentRef(function TreeGridCellInput(
  componentProps: TreeGridCellInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    className,
    controlKeys,
    disabled: disabledProp = false,
    focusableWhenDisabled = true,
    readOnly: readOnlyProp,
    render,
    style,
    tabIndex,
    ...elementProps
  } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const disabled = store.useState('isItemDisabled', itemId) || disabledProp;

  const disabledFocusable = disabled && focusableWhenDisabled;

  const control = useTreeGridCellControl({
    part: 'CellInput',
    controlKeys,
    defaultKeys: getInputControlKeys,
    disabled: disabled && !focusableWhenDisabled,
  });

  const state: TreeGridCellInputState = { disabled, focusable: focusableWhenDisabled };

  const preventWhenDisabled = (event: React.SyntheticEvent) => {
    if (disabledFocusable) {
      event.preventDefault();
    }
  };

  return useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, control.ref],
    props: [
      {
        tabIndex: tabIndex ?? control.tabIndex,
        disabled: disabled && !focusableWhenDisabled,
        'aria-disabled': disabledFocusable || undefined,
        // Blocks the edits that bypass the keyboard, such as pasting or dropping text.
        readOnly: disabledFocusable || readOnlyProp,
        onClick: preventWhenDisabled,
        onPointerDown: preventWhenDisabled,
        // `readOnly` doesn't keep a file input from accepting dropped files.
        onDrop: preventWhenDisabled,
        onKeyDown(event) {
          // Tab still moves focus away.
          if (disabledFocusable && event.key !== 'Tab') {
            event.preventDefault();
          }
        },
      },
      elementProps,
    ],
  });
});

export interface TreeGridCellInputState {
  /**
   * Whether the input is disabled.
   */
  disabled: boolean;
  /**
   * Whether the input remains focusable when disabled.
   */
  focusable: boolean;
}

export interface TreeGridCellInputProps extends BaseUIComponentProps<
  'input',
  TreeGridCellInputState
> {
  /**
   * Which keys the input handles itself instead of the tree.
   * By default, the input keeps Home and End. A text input keeps the Left and Right
   * arrows until the caret reaches the start or end of its text. Other inputs keep
   * them, including email and number inputs, which don't expose their caret.
   * The Up and Down arrows move between items unless the input uses them,
   * like a number or date input.
   */
  controlKeys?: TreeGridCellControlKeys | undefined;
  /**
   * Whether the input is disabled.
   * The input is also disabled while its item or the tree is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the input remains focusable when disabled.
   * A disabled input that remains focusable is read-only, and still submits its value with a form.
   * Otherwise it is natively disabled, and a form doesn't submit its value.
   * @default true
   */
  focusableWhenDisabled?: boolean | undefined;
  /**
   * The default value of the input. Use when uncontrolled.
   */
  defaultValue?: React.ComponentProps<'input'>['defaultValue'] | undefined;
}

export namespace TreeGridCellInput {
  export type State = TreeGridCellInputState;
  export type Props = TreeGridCellInputProps;
}
