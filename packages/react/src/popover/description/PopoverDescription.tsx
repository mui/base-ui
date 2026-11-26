'use client';
import * as React from 'react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * A paragraph with additional information about the popover.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverDescription = React.forwardRef(function PopoverDescription(
  componentProps: PopoverDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const store = usePopoverRootContext();

  const defaultId = useBaseUiId(idProp);
  const id = resolveRenderedId(componentProps, defaultId) || undefined;

  store.useSyncedValueWithCleanup('descriptionElementId', id);

  const element = useRenderElement('p', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return element;
});

export interface PopoverDescriptionState {}

export interface PopoverDescriptionProps extends BaseUIComponentProps<
  'p',
  PopoverDescriptionState
> {}

export namespace PopoverDescription {
  export type State = PopoverDescriptionState;
  export type Props = PopoverDescriptionProps;
}
