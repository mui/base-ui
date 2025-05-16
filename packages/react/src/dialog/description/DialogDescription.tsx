'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { mergeProps } from '../../merge-props';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';

const state = {};

/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogDescription = React.forwardRef(function DialogDescription(
  props: DialogDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;
  const { setDescriptionElementId } = useDialogRootContext();

  const id = useBaseUiId(idProp);

  useLayoutEffect(() => {
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

  const { renderElement } = useComponentRenderer({
    propGetter: getProps,
    render: render ?? 'p',
    className,
    state,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

export namespace DialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}
