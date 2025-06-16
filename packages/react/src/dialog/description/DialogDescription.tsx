'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';

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
  const { render, className, id: idProp, ...elementProps } = componentProps;
  const { setDescriptionElementId } = useDialogRootContext();

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setDescriptionElementId(id);
    return () => {
      setDescriptionElementId(undefined);
    };
  }, [id, setDescriptionElementId]);

  return useRenderElement('p', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });
});

export namespace DialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
