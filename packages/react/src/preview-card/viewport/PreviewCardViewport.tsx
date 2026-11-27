'use client';
import * as React from 'react';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupViewport } from '../../utils/popups/viewport/usePopupViewport';

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardViewport = React.forwardRef(function PreviewCardViewport(
  componentProps: PreviewCardViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = usePreviewCardRootContext();
  const { side } = usePreviewCardPositionerContext();

  return usePopupViewport({
    componentProps,
    forwardedRef,
    store,
    side,
  });
});

export interface PreviewCardViewportState {
  /**
   * The activation direction of the transitioned content.
   */
  activationDirection: string | undefined;
  /**
   * Whether the viewport is currently transitioning between contents.
   */
  transitioning: boolean;
  /**
   * Present if animations should be instant.
   */
  instant: 'dismiss' | 'focus' | undefined;
}

export interface PreviewCardViewportProps extends BaseUIComponentProps<
  'div',
  PreviewCardViewportState
> {
  /**
   * The content to render inside the transition container.
   */
  children?: React.ReactNode;
}

export namespace PreviewCardViewport {
  export type Props = PreviewCardViewportProps;
  export type State = PreviewCardViewportState;
}
