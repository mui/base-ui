'use client';
import * as React from 'react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupLabelElement } from '../../utils/popups/popupParts';

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
  return usePopupLabelElement(
    'p',
    componentProps,
    forwardedRef,
    usePopoverRootContext(),
    'descriptionElementId',
  );
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
