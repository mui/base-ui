'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupLabelElement } from '../../utils/popups/popupParts';

/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogDescription = React.forwardRef(function DialogDescription(
  componentProps: DialogDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  return usePopupLabelElement(
    'p',
    componentProps,
    forwardedRef,
    useDialogRootContext(),
    'descriptionElementId',
  );
});

export interface DialogDescriptionProps extends BaseUIComponentProps<'p', DialogDescriptionState> {}

export interface DialogDescriptionState {}

export namespace DialogDescription {
  export type Props = DialogDescriptionProps;
  export type State = DialogDescriptionState;
}
