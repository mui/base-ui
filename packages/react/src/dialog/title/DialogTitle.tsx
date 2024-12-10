'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { type BaseUIComponentProps } from '../../utils/types';

const state = {};

/**
 * A heading that labels the dialog. Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogTitle = React.forwardRef(function DialogTitle(
  props: DialogTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;
  const { setTitleElementId } = useDialogRootContext();

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setTitleElementId(id);
    return () => {
      setTitleElementId(undefined);
    };
  }, [id, setTitleElementId]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h2',
    className,
    state,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

namespace DialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', State> {}

  export interface State {}
}

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

export { DialogTitle };
