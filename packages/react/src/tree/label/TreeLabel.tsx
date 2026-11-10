'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { REASONS } from '../../internals/reasons';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';

/**
 * An accessible label that is automatically associated with the tree.
 * Clicking it focuses the tree.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeLabel = React.forwardRef(function TreeLabel(
  componentProps: TreeLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const id = useBaseUiId(idProp);
  // An empty id on the `render` element leaves the label without one to reference.
  store.useSyncedValueWithCleanup('labelId', resolveRenderedId(componentProps, id) || undefined);

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        id,
        onClick(event: React.MouseEvent) {
          const tabbableItemId = selectors.tabbableItemId(store.state);
          if (tabbableItemId != null) {
            store.interaction.focusItem(tabbableItemId, REASONS.itemPress, event.nativeEvent);
          }
        },
        onPointerDown(event: React.PointerEvent) {
          // Keep focus where it is until the click moves it into the tree.
          event.preventDefault();
        },
      },
      elementProps,
    ],
  });
});

export interface TreeLabelState {}

export interface TreeLabelProps extends BaseUIComponentProps<'div', TreeLabel.State> {}

export namespace TreeLabel {
  export type State = TreeLabelState;
  export type Props = TreeLabelProps;
}
