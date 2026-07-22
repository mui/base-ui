'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
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
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverViewport = React.forwardRef(function PopoverViewport(
  componentProps: PopoverViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, transitionKey, ...elementProps } = componentProps;

  const store = usePopoverRootContext();
  const { side } = usePopoverPositionerContext();

  const instantType = store.useState('instantType');

  const handleFocusRecovery = useStableCallback((container: HTMLElement) => {
    focusFirstTabbable(container, store.select('popupElement'));
  });

  const { children: childrenToRender, state: viewportState } = usePopupViewport({
    store,
    side,
    children,
    transitionKey,
    onFocusRecovery: handleFocusRecovery,
  });

  const state: PopoverViewportState = {
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

export interface PopoverViewportState {
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
  instant: 'dismiss' | 'click' | 'focus' | 'trigger-change' | undefined;
}

export interface PopoverViewportProps extends BaseUIComponentProps<'div', PopoverViewportState> {
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

export namespace PopoverViewport {
  export type Props = PopoverViewportProps;
  export type State = PopoverViewportState;
}
