'use client';
import * as React from 'react';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { getDisabledMountTransitionStyles } from '../../utils/getDisabledMountTransitionStyles';
import { useHoverFloatingInteraction } from '../../floating-ui-react';

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
  componentProps: PreviewCardPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = usePreviewCardRootContext();
  const open = store.useState('open');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');

  const { side, align } = usePreviewCardPositionerContext();

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  const floatingRootContext = store.useState('floatingRootContext');

  useHoverFloatingInteraction(floatingRootContext, {
    closeDelay: () => store.context.closeDelayRef.current,
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

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, store.useStateSetter('popupElement')],
    props: [popupProps, getDisabledMountTransitionStyles(transitionStatus), elementProps],
    stateAttributesMapping,
  });

  return element;
});

export interface PreviewCardPopupState {
  /**
   * Whether the preview card is currently open.
   */
  open: boolean;
  side: Side;
  align: Align;
  transitionStatus: TransitionStatus;
}

export interface PreviewCardPopupProps extends BaseUIComponentProps<
  'div',
  PreviewCardPopup.State
> {}

export namespace PreviewCardPopup {
  export type State = PreviewCardPopupState;
  export type Props = PreviewCardPopupProps;
}
