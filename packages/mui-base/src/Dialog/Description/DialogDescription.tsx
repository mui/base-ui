import * as React from 'react';
import PropTypes from 'prop-types';
import type { DialogDescriptionProps } from './DialogDescription.types';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';
import { useDialogRootContext } from '../Root/DialogRootContext';

const DialogDescription = React.forwardRef(function DialogDescription(
  props: DialogDescriptionProps,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id, ...other } = props;
  const { setDescriptionElementId, open, modal } = useDialogRootContext();
  const ownerState = {
    open,
    modal,
  };

  React.useEffect(() => {
    setDescriptionElementId(id);
    return () => {
      setDescriptionElementId(undefined);
    };
  }, [id, setDescriptionElementId]);

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.p,
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

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
