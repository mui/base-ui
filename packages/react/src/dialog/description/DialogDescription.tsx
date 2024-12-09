'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';

const state = {};

/**
 * A paragraph with additional information about the dialog. Renders a `<p>` element.
 */
const DialogDescription = React.forwardRef(function DialogDescription(
  props: DialogDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;
  const { setDescriptionElementId } = useDialogRootContext();

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

namespace DialogDescription {
  export interface Props extends BaseUIComponentProps<'p', State> {}

  export interface State {}
}

DialogDescription.propTypes /* remove-proptypes */ = {
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

export { DialogDescription };
