'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';

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
  const { render, className, ...elementProps } = componentProps;

  const { store } = usePopoverRootContext();

  const id = useBaseUiId(elementProps.id);

  useIsoLayoutEffect(() => {
    store.set('titleElementId', id);
    return () => {
      store.set('titleElementId', undefined);
    };
  }, [store, id]);

  const element = useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return element;
});

export interface PopoverTitleState {}

export interface PopoverTitleProps extends BaseUIComponentProps<
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  PopoverTitle.State
> {}

export namespace PopoverTitle {
  export type State = PopoverTitleState;
  export type Props = PopoverTitleProps;
}
