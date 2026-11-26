'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { resolveRenderedId } from '../../internals/resolveRenderedId';

/**
 * A heading that labels the popover.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverTitle = React.forwardRef(function PopoverTitle(
  componentProps: PopoverTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const store = usePopoverRootContext();

  const defaultId = useBaseUiId(idProp);
  const id = resolveRenderedId(componentProps, defaultId) || undefined;

  store.useSyncedValueWithCleanup('titleElementId', id);

  const element = useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return element;
});

export interface PopoverTitleState {}

export interface PopoverTitleProps extends BaseUIComponentProps<
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  PopoverTitleState
> {}

export namespace PopoverTitle {
  export type State = PopoverTitleState;
  export type Props = PopoverTitleProps;
}
