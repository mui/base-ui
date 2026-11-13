'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopupLabelElement } from '../../utils/popups/popupParts';

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
  return usePopupLabelElement(
    'h2',
    componentProps,
    forwardedRef,
    usePopoverRootContext(),
    'titleElementId',
  );
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
