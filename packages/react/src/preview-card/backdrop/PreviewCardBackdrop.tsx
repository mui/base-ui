'use client';
import * as React from 'react';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useRenderElement } from '../../utils/useRenderElement';

const customStyleHookMapping: CustomStyleHookMapping<PreviewCardBackdrop.State> = {
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

  const state: PreviewCardBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef],
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      elementProps,
    ],
    customStyleHookMapping,
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
