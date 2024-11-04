'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { usePopoverTitle } from './usePopoverTitle';

const ownerState = {};

/**
 * Renders a title element that labels the popover.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverTitle API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverTitle)
 */
const PopoverTitle = React.forwardRef(function PopoverTitle(
  props: PopoverTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...otherProps } = props;

  const { setTitleId } = usePopoverRootContext();

  const { getTitleProps } = usePopoverTitle({
    titleId: otherProps.id,
    setTitleId,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getTitleProps,
    render: render ?? 'h2',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace PopoverTitle {
  export interface OwnerState {}

  export type Props = BaseUIComponentProps<
    'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    OwnerState
  > & {};
}

PopoverTitle.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
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

export { PopoverTitle };
