'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { usePreviewCardBackdrop } from './usePreviewCardBackdrop';
import type { BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

const customStyleHookMapping: CustomStyleHookMapping<PreviewCardBackdrop.State> = {
  ...baseMapping,
  transitionStatus(value) {
    if (value === 'entering') {
      return { 'data-starting-style': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-ending-style': '' };
    }
    return null;
  },
};

/**
 *
 * Demos:
 *
 * - [Preview Card](https://base-ui.com/components/react-preview-card/)
 *
 * API:
 *
 * - [PreviewCardBackdrop API](https://base-ui.com/components/react-preview-card/#api-reference-PreviewCardBackdrop)
 */
const PreviewCardBackdrop = React.forwardRef(function PreviewCardBackdrop(
  props: PreviewCardBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const { open, mounted, transitionStatus } = usePreviewCardRootContext();
  const { getBackdropProps } = usePreviewCardBackdrop();

  const state: PreviewCardBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getBackdropProps,
    render: render ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace PreviewCardBackdrop {
  export interface State {
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the `Backdrop` remains mounted when the Preview Card `Popup` is closed.
     * @default false
     */
    keepMounted?: boolean;
  }
}

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
   * Whether the `Backdrop` remains mounted when the Preview Card `Popup` is closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PreviewCardBackdrop };
