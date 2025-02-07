import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';
import { CustomStyleHookMapping as StyleHookMapping } from '../utils/getStyleHookProps';

/**
 * Returns a function that renders a Base UI component.
 */
function useRenderer<State extends Record<string, any>, RenderedElementType extends Element>(
  settings: useRenderer.Settings<State, RenderedElementType>,
) {
  const { className, render, state, ref, props, styleHookMapping } = settings;

  return useComponentRenderer({
    className,
    render,
    state,
    ref,
    extraProps: props,
    propGetter: (x) => x,
    customStyleHookMapping: styleHookMapping,
  });
}

type RenderProp<State> =
  | ComponentRenderFn<React.HTMLAttributes<any>, State>
  | React.ReactElement<Record<string, unknown>>
  | keyof typeof defaultRenderFunctions;

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
    render: RenderProp<State>;
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
    props?: Record<string, unknown>;
    /**
     * A mapping of state to style hooks.
     */
    styleHookMapping?: StyleHookMapping<State>;
  }
}

export type { ComponentRenderFn, StyleHookMapping, RenderProp };

export { useRenderer };
