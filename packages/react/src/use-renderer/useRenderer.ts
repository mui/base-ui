import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';
import { CustomStyleHookMapping } from '../utils/getStyleHookProps';

/**
 * Returns a function that renders a Base UI component.
 */
function useRenderer<State extends Record<string, any>, RenderedElementType extends Element>(
  settings: useRenderer.Settings<State, RenderedElementType>,
) {
  const { className, render, state, ref, props, customStyleHookMapping } = settings;

  return useComponentRenderer({
    className,
    render,
    state,
    ref,
    extraProps: props,
    propGetter: (x) => x,
    customStyleHookMapping,
  });
}

namespace useRenderer {
  export interface Settings<State, RenderedElementType extends Element> {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    className?: string | ((state: State) => string);
    /**
     * The render prop or React element to override the default element.
     */
    render:
      | ComponentRenderFn<React.HTMLAttributes<any>, State>
      | React.ReactElement<Record<string, unknown>>
      | keyof typeof defaultRenderFunctions;
    /**
     * The state of the component. It will be used as a parameter for the render and className callbacks.
     */
    state: State;
    /**
     * The ref to apply to the rendered element.
     */
    ref?: React.Ref<RenderedElementType>;
    /**
     * Props to be spread on the rendered element.
     */
    props?: Record<string, any>;
    /**
     * A mapping of state to style hooks.
     */
    customStyleHookMapping?: CustomStyleHookMapping<State>;
  }
}

export { useRenderer };
