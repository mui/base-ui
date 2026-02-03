'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { NativeButtonComponentProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

/**
 * A button that closes the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogClose = React.forwardRef(function DialogClose(
  componentProps: DialogClose.Props,
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

  const { store } = useDialogRootContext();
  const open = store.useState('open');

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: DialogCloseState = { disabled };

  function handleClick(event: React.MouseEvent) {
    if (open) {
      store.setOpen(false, createChangeEventDetails(REASONS.closePress, event.nativeEvent));
    }
  }

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [{ onClick: handleClick }, elementProps, getButtonProps],
  });
}) as unknown as DialogCloseComponent;

export type DialogCloseProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, DialogClose.State>;

export interface DialogCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export namespace DialogClose {
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = DialogCloseProps<TNativeButton, TElement>;
  export type State = DialogCloseState;
}

type DialogCloseComponent = {
  <TElement extends React.ElementType = 'button'>(
    props: DialogClose.Props<true, TElement> & { ref?: React.Ref<HTMLButtonElement> | undefined },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: DialogClose.Props<false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: DialogClose.Props<boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
