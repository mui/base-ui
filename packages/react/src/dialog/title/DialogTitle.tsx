'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { type BaseUIComponentProps } from '../../utils/types';

/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTitle = React.forwardRef(function DialogTitle(
  componentProps: DialogTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...elementProps } = componentProps;
  const { setTitleElementId } = useDialogRootContext();

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    setTitleElementId(id);
    return () => {
      setTitleElementId(undefined);
    };
  }, [id, setTitleElementId]);

  return useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });
});

export namespace DialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
