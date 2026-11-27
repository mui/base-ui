'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { focusElementWithVisible } from '../../internals/labelable-provider/useLabel';
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
  // The press behind a click, so the highlight reports the focus it moves as a pointer one.
  const pressEventRef = React.useRef<PointerEvent | null>(null);

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        id,
        onClick(event: React.MouseEvent) {
          // A click without a press, such as from assistive technology, has no pointer behind it.
          const pressEvent = event.detail > 0 ? pressEventRef.current : null;
          pressEventRef.current = null;
          const tabbableItemId = selectors.tabbableItemId(store.state);
          if (tabbableItemId != null) {
            store.interaction.focusItem(tabbableItemId, pressEvent ?? event.nativeEvent);
            return;
          }
          // Without a row to focus, the container holds the tab stop, unless the tree is disabled.
          const rootElement = store.context.rootRef.current;
          if (rootElement != null && !store.state.disabled) {
            focusElementWithVisible(rootElement);
          }
        },
        onPointerDown(event: React.PointerEvent) {
          pressEventRef.current = event.nativeEvent;
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
