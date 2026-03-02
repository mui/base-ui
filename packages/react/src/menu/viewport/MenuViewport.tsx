'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { usePopupViewport } from '../../utils/usePopupViewport';
import { MenuViewportCssVars } from './MenuViewportCssVars';

const stateAttributesMapping: StateAttributesMapping<MenuViewport.State> = {
  activationDirection: (value) =>
    value
      ? {
          'data-activation-direction': value,
        }
      : null,
};

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content change based on the trigger
 * and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuViewport = React.forwardRef(function MenuViewport(
  componentProps: MenuViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...elementProps } = componentProps;

  const { store } = useMenuRootContext();
  const { side } = useMenuPositionerContext();

  const instantType = store.useState('instantType');

  const { children: childrenToRender, state: viewportState } = usePopupViewport({
    store,
    side,
    cssVars: MenuViewportCssVars,
    children,
  });

  const state: MenuViewport.State = {
    activationDirection: viewportState.activationDirection,
    transitioning: viewportState.transitioning,
    instant: instantType,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, { children: childrenToRender }],
    stateAttributesMapping,
  });
});

export namespace MenuViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content to render inside the transition container.
     */
    children?: React.ReactNode;
  }

  export interface State {
    activationDirection: string | undefined;
    /**
     * Whether the viewport is currently transitioning between contents.
     */
    transitioning: boolean;
    /**
     * Present if animations should be instant.
     */
    instant: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined;
  }
}
