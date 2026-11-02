'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupLabelElement } from '../../utils/popups/popupParts';

/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTitle = React.forwardRef(function DialogTitle(
  componentProps: DialogTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  return usePopupLabelElement(
    'h2',
    componentProps,
    forwardedRef,
    useDialogRootContext(),
    'titleElementId',
  );
});

export interface DialogTitleProps extends BaseUIComponentProps<'h2', DialogTitleState> {}

export interface DialogTitleState {}

export namespace DialogTitle {
  export type Props = DialogTitleProps;
  export type State = DialogTitleState;
}
