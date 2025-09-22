'use client';
import * as React from 'react';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { type StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBodyClientHeight } from '../../utils/useBodyClientHeight';
import { PreviewCardBackdropCssVars } from './PreviewCardBackdropCssVars';

const stateAttributesMapping: StateAttributesMapping<PreviewCardBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardBackdrop = React.forwardRef(function PreviewCardBackdrop(
  componentProps: PreviewCardBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { open, mounted, transitionStatus } = usePreviewCardRootContext();

  const backdropRef = React.useRef<HTMLDivElement | null>(null);

  const bodyClientHeight = useBodyClientHeight(backdropRef, open);

  const state: PreviewCardBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [backdropRef, forwardedRef],
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          [PreviewCardBackdropCssVars.bodyClientHeight as string]: `${bodyClientHeight}px`,
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  return element;
});

export namespace PreviewCardBackdrop {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
