'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { mergeProps } from '../../merge-props';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';

const state = {};

/**
 * A paragraph with additional information about the alert dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
const AlertDialogDescription = React.forwardRef(function AlertDialogDescription(
  props: AlertDialogDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;
  const { setDescriptionElementId } = useAlertDialogRootContext();

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
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

namespace AlertDialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}

export { AlertDialogDescription };
