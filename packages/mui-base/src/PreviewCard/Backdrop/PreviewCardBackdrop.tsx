'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import {
  PreviewCardBackdropOwnerState,
  PreviewCardBackdropProps,
} from './PreviewCardBackdrop.types';
import { usePreviewCardRootContext } from '../Root/PreviewCardContext';
import { usePreviewCardBackdrop } from './usePreviewCardBackdrop';
import { HTMLElementType } from '../../utils/proptypes';

const PreviewCardBackdrop = React.forwardRef(function PreviewCardBackdrop(
  props: PreviewCardBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, container, ...otherProps } = props;

  const { open, mounted } = usePreviewCardRootContext();
  const { getBackdropProps } = usePreviewCardBackdrop();

  const ownerState: PreviewCardBackdropOwnerState = React.useMemo(() => ({ open }), [open]);

  const { renderElement } = useComponentRenderer({
    propGetter: getBackdropProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{renderElement()}</FloatingPortal>;
});

PreviewCardBackdrop.propTypes /* remove-proptypes */ = {
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
   * The element the `Backdrop` is appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * Whether the `Backdrop` remains mounted when the Hover Card `Popup` is closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PreviewCardBackdrop };
