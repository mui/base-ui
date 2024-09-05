'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { PreviewCardPopupOwnerState, PreviewCardPopupProps } from './PreviewCardPopup.types';
import { usePreviewCardRootContext } from '../Root/PreviewCardContext';
import { usePreviewCardPositionerContext } from '../Positioner/PreviewCardPositionerContext';
import { usePreviewCardPopup } from './usePreviewCardPopup';
import { useForkRef } from '../../utils/useForkRef';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<PreviewCardPopupOwnerState> = {
  entering(value) {
    return value ? { 'data-entering': '' } : null;
  },
  exiting(value) {
    return value ? { 'data-exiting': '' } : null;
  },
  open(value) {
    return {
      'data-state': value ? 'open' : 'closed',
    };
  },
};

/**
 *
 * Demos:
 *
 * - [Preview Card](https://base-ui.netlify.app/components/react-preview-card/)
 *
 * API:
 *
 * - [PreviewCardPopup API](https://base-ui.netlify.app/components/react-preview-card/#api-reference-PreviewCardPopup)
 */
const PreviewCardPopup = React.forwardRef(function PreviewCardPopup(
  props: PreviewCardPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, transitionStatus, getRootPopupProps, popupRef } = usePreviewCardRootContext();
  const { side, alignment } = usePreviewCardPositionerContext();

  const { getPopupProps } = usePreviewCardPopup({
    getProps: getRootPopupProps,
  });

  const ownerState: PreviewCardPopupOwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      entering: transitionStatus === 'entering',
      exiting: transitionStatus === 'exiting',
    }),
    [open, side, alignment, transitionStatus],
  );

  const mergedRef = useForkRef(popupRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getPopupProps,
    ref: mergedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return renderElement();
});

PreviewCardPopup.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PreviewCardPopup };
