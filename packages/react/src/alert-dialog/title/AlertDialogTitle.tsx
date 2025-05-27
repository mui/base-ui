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
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogTitle = React.forwardRef(function AlertDialogTitle(
  componentProps: AlertDialogTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...elementProps } = componentProps;
  const { setTitleElementId } = useAlertDialogRootContext();

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setTitleElementId(id);
    return () => {
      setTitleElementId(undefined);
    };
  }, [id, setTitleElementId]);

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

  return useRenderElement('h2', componentProps, {
    propGetter: getProps,
    state,
    ref: forwardedRef,
    props: elementProps,
  });
});

export namespace AlertDialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
