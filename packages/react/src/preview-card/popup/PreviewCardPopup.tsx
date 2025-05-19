'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import { usePreviewCardPopup } from './usePreviewCardPopup';
import { useForkRef } from '../../utils/useForkRef';
import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { mergeProps } from '../../merge-props';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

const stateAttributesMapping: StateAttributesMapping<PreviewCardPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the preview card contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardPopup = React.forwardRef(function PreviewCardPopup(
  props: PreviewCardPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, transitionStatus, getRootPopupProps, popupRef, onOpenChangeComplete } =
    usePreviewCardRootContext();
  const { side, align } = usePreviewCardPositionerContext();

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const { getPopupProps } = usePreviewCardPopup({
    getProps: getRootPopupProps,
  });

  const state: PreviewCardPopup.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      transitionStatus,
    }),
    [open, side, align, transitionStatus],
  );

  const mergedRef = useForkRef(popupRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getPopupProps,
    ref: mergedRef,
    render: render ?? 'div',
    className,
    state,
    extraProps:
      transitionStatus === 'starting'
        ? mergeProps(
            {
              style: { transition: 'none' },
            },
            otherProps,
          )
        : otherProps,
    stateAttributesMapping,
  });

  return renderElement();
});

export namespace PreviewCardPopup {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
