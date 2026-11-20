'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useTreeFilterPart } from '../filter-provider/TreeFilterContext';

/**
 * A button that clears the input text.
 * Requires the tree to be wrapped in `Tree.FilterProvider`.
 * Renders a `<button>` element when the input has text.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeClear = React.forwardRef(function TreeClear(
  componentProps: TreeClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { store, filtering, value, onValueChange } = useTreeFilterPart('Clear');
  const treeDisabled = useStore(store, (state) => state.disabled);
  const disabled = treeDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({ disabled, native: nativeButton });

  const state: TreeClear.State = { disabled };

  return useRenderElement('button', componentProps, {
    enabled: value !== '',
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        'aria-label': 'Clear filter',
        // Escape and the input's own editing clear the query from the
        // keyboard, so the button stays out of the tab order. It stays exposed
        // to assistive technology for touch screen reader and voice control
        // users, who have no Escape key.
        tabIndex: -1,
        onMouseDown(event: React.MouseEvent) {
          // Keep focus in the input.
          event.preventDefault();
        },
        onClick(event: React.MouseEvent) {
          onValueChange('', createChangeEventDetails(REASONS.clearPress, event.nativeEvent));
          filtering.focusInput();
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
});

export interface TreeClearState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface TreeClearProps
  extends NativeButtonProps, BaseUIComponentProps<'button', TreeClearState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace TreeClear {
  export type State = TreeClearState;
  export type Props = TreeClearProps;
}
