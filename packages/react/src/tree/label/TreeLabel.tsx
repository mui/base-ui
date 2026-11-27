'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { focusElementWithVisible, useLabel } from '../../internals/labelable-provider/useLabel';
import { useTreeRootContext } from '../root/TreeRootContext';

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
  // Ignore an `id` from untyped consumers, so the tree references the id the label renders.
  const {
    render,
    className,
    style,
    id: ignoredId,
    ...elementProps
  } = componentProps as TreeLabel.Props & { id?: string | undefined };

  const store = useTreeRootContext();
  // The press behind a click, so the highlight reports the focus it moves as a pointer one.
  const pressEventRef = React.useRef<PointerEvent | null>(null);

  const labelProps = useLabel({
    // The `render` element's id wins over the generated one, so the tree references it instead.
    id: resolveRenderedId({ render }, undefined),
    setLabelId(nextLabelId) {
      const labelId =
        typeof nextLabelId === 'function' ? nextLabelId(store.state.labelId) : nextLabelId;
      // An empty id on the `render` element leaves the label without one to reference.
      store.set('labelId', labelId || undefined);
    },
    labelsFieldControl: false,
    focusControl(event) {
      // A click without a press, such as from assistive technology, has no pointer behind it.
      const pressEvent = event.detail > 0 ? pressEventRef.current : null;
      pressEventRef.current = null;
      // A disabled tree has no tab stop. Without a row to hold it, the container does.
      if (
        !store.state.disabled &&
        !store.interaction.focusTabStop(pressEvent ?? event.nativeEvent)
      ) {
        const rootElement = store.context.rootRef.current;
        if (rootElement != null) {
          focusElementWithVisible(rootElement);
        }
      }
    },
  });

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      labelProps,
      {
        onPointerDown(event: React.PointerEvent) {
          pressEventRef.current = event.nativeEvent;
        },
      },
      elementProps,
    ],
  });
});

export interface TreeLabelState {}

export interface TreeLabelProps extends Omit<BaseUIComponentProps<'div', TreeLabel.State>, 'id'> {}

export namespace TreeLabel {
  export type State = TreeLabelState;
  export type Props = TreeLabelProps;
}
