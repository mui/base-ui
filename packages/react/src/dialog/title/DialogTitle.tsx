'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { mergeProps } from '../../merge-props';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { type BaseUIComponentProps } from '../../utils/types';

const state = {};

/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTitle = React.forwardRef(function DialogTitle(
  props: DialogTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;
  const { setTitleElementId } = useDialogRootContext();

  const id = useBaseUiId(idProp);

  useLayoutEffect(() => {
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

  const { renderElement } = useComponentRenderer({
    propGetter: getProps,
    render: render ?? 'h2',
    className,
    state,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

export namespace DialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}
