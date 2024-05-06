import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import type { DialogBackdropOwnerState, DialogBackdropProps } from './DialogBackdrop.types';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';

const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...other } = props;
  const { open, modal, type } = useDialogRootContext();
  const ownerState: DialogBackdropOwnerState = { open, modal, type };

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.div,
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: other,
  });

  if (!open) {
    return null;
  }

  return renderElement();
});

export { DialogBackdrop };
