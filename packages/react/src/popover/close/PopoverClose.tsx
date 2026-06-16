'use client';
import * as React from 'react';
import type { NativeButtonComponentProps } from '../../internals/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useClosePartRegistration } from '../../utils/closePart';

/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverClose = React.forwardRef(function PopoverClose(
  componentProps: PopoverClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    style,
    disabled = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { buttonRef, getButtonProps } = useButton({
    disabled,
    focusableWhenDisabled: false,
    native: nativeButton,
  });

  const { store } = usePopoverRootContext();
  useClosePartRegistration();

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    props: [
      {
        onClick(event) {
          store.setOpen(false, createChangeEventDetails(REASONS.closePress, event.nativeEvent));
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
}) as unknown as PopoverCloseComponent;

export interface PopoverCloseState {}

export type PopoverCloseProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, PopoverClose.State>;

export namespace PopoverClose {
  export type State = PopoverCloseState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = PopoverCloseProps<TNativeButton, TElement>;
}

type PopoverCloseComponent = {
  <TElement extends React.ElementType = 'button'>(
    props: PopoverClose.Props<true, TElement> & { ref?: React.Ref<HTMLButtonElement> | undefined },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: PopoverClose.Props<false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: PopoverClose.Props<boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
