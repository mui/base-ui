'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardRootContext } from '../Root/PreviewCardContext';
import { usePreviewCardPositionerContext } from '../Positioner/PreviewCardPositionerContext';
import { usePreviewCardPopup } from './usePreviewCardPopup';
import { useForkRef } from '../../utils/useForkRef';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { Alignment, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

const customStyleHookMapping: CustomStyleHookMapping<PreviewCardPopup.OwnerState> = {
  entering(value) {
    return value ? { 'data-entering': '' } : null;
  },
  exiting(value) {
    return value ? { 'data-exiting': '' } : null;
  },
  open(value) {
    return {
      'data-previewcard': value ? 'open' : 'closed',
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
  props: PreviewCardPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, transitionStatus, getRootPopupProps, popupRef } = usePreviewCardRootContext();
  const { side, alignment } = usePreviewCardPositionerContext();

  const { getPopupProps } = usePreviewCardPopup({
    getProps: getRootPopupProps,
  });

  const ownerState: PreviewCardPopup.OwnerState = React.useMemo(
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

namespace PreviewCardPopup {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
    entering: boolean;
    exiting: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

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
