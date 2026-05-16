'use client';

import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import { useDropzoneRootContext } from '../root/DropzoneRootContext';

export interface DropzoneHiddenInputState {
  /**
   * Whether the parent dropzone is disabled.
   */
  disabled: boolean;
}

export interface DropzoneHiddenInputProps extends Omit<
  BaseUIComponentProps<'input', DropzoneHiddenInputState>,
  'type'
> {}

/**
 * Hidden file input that enables file selection.
 */
export const DropzoneHiddenInput = React.forwardRef(function DropzoneHiddenInput(
  componentProps: DropzoneHiddenInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { disabled, setInputElement } = useDropzoneRootContext();
  const { render, className, style, ...elementProps } = componentProps;

  return useRenderElement('input', componentProps, {
    state: { disabled },
    ref: [forwardedRef, setInputElement],
    props: [
      elementProps,
      {
        type: 'file',
        disabled,
        suppressHydrationWarning: true,
        style: elementProps.name ? visuallyHiddenInput : visuallyHidden,
      },
    ],
  });
});

export namespace DropzoneHiddenInput {
  export type State = DropzoneHiddenInputState;
  export type Props = DropzoneHiddenInputProps;
}
