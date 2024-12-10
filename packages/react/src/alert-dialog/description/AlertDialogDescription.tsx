'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
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

  const { renderElement } = useComponentRenderer({
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
