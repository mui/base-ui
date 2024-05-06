import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogCloseProps } from './DialogClose.types';
import { useDialogClose } from './useDialogClose';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';

const DialogClose = React.forwardRef(function DialogClose(
  props: DialogCloseProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const { getRootProps, open, modal, type } = useDialogClose();

  const ownerState = {
    open,
    modal,
    type,
  };

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.button,
    className,
    ownerState,
    propGetter: getRootProps,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

DialogClose.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { DialogClose };
