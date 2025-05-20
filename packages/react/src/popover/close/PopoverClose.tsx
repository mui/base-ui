'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverClose = React.forwardRef(function PopoverClose(
  props: PopoverClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...elementProps } = props;

  const { setOpen } = usePopoverRootContext();

  const element = useRenderElement('button', props, {
    ref: forwardedRef,
    props: [
      {
        onClick() {
          setOpen(false, undefined, undefined);
        },
      },
      elementProps,
    ],
  });

  return element;
});

export namespace PopoverClose {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
