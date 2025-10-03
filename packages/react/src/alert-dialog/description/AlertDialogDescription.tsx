'use client';
import * as React from 'react';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A paragraph with additional information about the alert dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogDescription = React.forwardRef(function AlertDialogDescription(
  componentProps: AlertDialogDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...elementProps } = componentProps;
  const { store } = useDialogRootContext();

  const id = useBaseUiId(idProp);

  store.useSyncedValueWithCleanup('descriptionElementId', id);

  return useRenderElement('p', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });
});

export interface AlertDialogDescriptionProps
  extends BaseUIComponentProps<'p', AlertDialogDescriptionState> {}

export interface AlertDialogDescriptionState {}

export namespace AlertDialogDescription {
  export type Props = AlertDialogDescriptionProps;
  export type State = AlertDialogDescriptionState;
}
