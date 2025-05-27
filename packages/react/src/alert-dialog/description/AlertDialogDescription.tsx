'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { mergeProps } from '../../merge-props';
import { useRenderElement } from '../../utils/useRenderElement';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';

const state = {};

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
  const { setDescriptionElementId } = useAlertDialogRootContext();

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setDescriptionElementId(id);
    return () => {
      setDescriptionElementId(undefined);
    };
  }, [id, setDescriptionElementId]);

  const getProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          id,
        },
        externalProps,
      ),
    [id],
  );

  return useRenderElement('p', componentProps, {
    propGetter: getProps,
    state,
    ref: forwardedRef,
    props: elementProps,
  });
});

export namespace AlertDialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
