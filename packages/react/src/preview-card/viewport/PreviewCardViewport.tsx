'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import {
  focusFirstTabbable,
  popupViewportStateMapping,
  usePopupViewport,
} from '../../utils/usePopupViewport';

/**
 * A viewport for displaying content transitions.
 * Use this component when the popup's content changes while open and the change should be animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardViewport = React.forwardRef(function PreviewCardViewport(
  componentProps: PreviewCardViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, transitionKey, ...elementProps } = componentProps;

  const store = usePreviewCardRootContext();
  const positioner = usePreviewCardPositionerContext();

  const instantType = store.useState('instantType');

  const handleFocusRecovery = useStableCallback((container: HTMLElement) => {
    focusFirstTabbable(container, store.select('popupElement'));
  });

  const { children: childrenToRender, state: viewportState } = usePopupViewport({
    store,
    side: positioner.side,
    children,
    transitionKey,
    onFocusRecovery: handleFocusRecovery,
  });

  const state: PreviewCardViewportState = {
    activationDirection: viewportState.activationDirection,
    transitioning: viewportState.transitioning,
    instant: instantType,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, { children: childrenToRender }],
    stateAttributesMapping: popupViewportStateMapping,
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
  /**
   * A key that identifies the current content. When it changes, the viewport animates to the new
   * content and moves focus to the first tabbable element if focus was inside the previous content.
   */
  transitionKey?: React.Key | undefined;
}

export namespace PreviewCardViewport {
  export type Props = PreviewCardViewportProps;
  export type State = PreviewCardViewportState;
}
