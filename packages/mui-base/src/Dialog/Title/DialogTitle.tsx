import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogTitle } from './useDialogTitle';
import type { DialogTitleProps } from './DialogTitle.types';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';

const DialogTitle = React.forwardRef(function DialogTitle(
  props: DialogTitleProps,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id, ...other } = props;

  const { getRootProps, open, modal, type } = useDialogTitle({ id });
  const ownerState = {
    open,
    modal,
    type,
  };

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.p,
    className,
    ownerState,
    propGetter: getRootProps,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

DialogTitle.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  id: PropTypes.string,
} as any;

export { DialogTitle };
