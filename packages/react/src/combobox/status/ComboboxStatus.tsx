'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useInitialLiveRegionTextMutation } from '../utils/useInitialLiveRegionTextMutation';

/**
 * Displays a status message whose content changes are announced politely to screen readers.
 * Useful for conveying the status of an asynchronously loaded list.
 * To announce updates reliably, keep this element mounted instead of conditionally
 * hiding or removing it with `display: none`, `hidden`, or `aria-hidden`; prefer
 * CSS such as `:empty` to conditionally apply layout styles when it has no content.
 * Renders a `<div>` element.
 */
export const ComboboxStatus = React.forwardRef(function ComboboxStatus(
  componentProps: ComboboxStatus.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children: childrenProp, ...elementProps } = componentProps;
  const statusRef = useInitialLiveRegionTextMutation<HTMLDivElement>();

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, statusRef],
    props: [
      {
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
        children: childrenProp,
      },
      elementProps,
    ],
  });
});

export interface ComboboxStatusState {}

export interface ComboboxStatusProps extends BaseUIComponentProps<'div', ComboboxStatusState> {}

export namespace ComboboxStatus {
  export type State = ComboboxStatusState;
  export type Props = ComboboxStatusProps;
}
