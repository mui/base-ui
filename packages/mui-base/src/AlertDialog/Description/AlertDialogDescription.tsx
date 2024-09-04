'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import type {
  AlertDialogDescriptionOwnerState,
  AlertDialogDescriptionProps,
} from './AlertDialogDescription.types';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';

const AlertDialogDescription = React.forwardRef(function AlertDialogDescription(
  props: AlertDialogDescriptionProps,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;
  const { setDescriptionElementId, open } = useAlertDialogRootContext();

  const ownerState: AlertDialogDescriptionOwnerState = {
    open,
  };

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setDescriptionElementId(id);
    return () => {
      setDescriptionElementId(undefined);
    };
  }, [id, setDescriptionElementId]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'p',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

AlertDialogDescription.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AlertDialogDescription };
