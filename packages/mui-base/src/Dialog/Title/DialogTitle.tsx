'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import { type BaseUIComponentProps } from '../../utils/types';
import { customStyleHookMapping } from '../../utils/popupOpenStateMapping';

const ownerState = {};

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.netlify.app/components/react-dialog/)
 *
 * API:
 *
 * - [DialogTitle API](https://base-ui.netlify.app/components/react-dialog/#api-reference-DialogTitle)
 */
const DialogTitle = React.forwardRef(function DialogTitle(
  props: DialogTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;
  const { setTitleElementId } = useDialogRootContext();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setTitleElementId(id);
    return () => {
      setTitleElementId(undefined);
    };
  }, [id, setTitleElementId]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h2',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: other,
    customStyleHookMapping,
  });

  return renderElement();
});

namespace DialogTitle {
  export interface Props extends BaseUIComponentProps<'h2', OwnerState> {}

  export interface OwnerState {}
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
