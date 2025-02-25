import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';
import { CustomStyleHookMapping as StateAttributes } from '../utils/getStyleHookProps';

/**
 * Returns a function that renders a Base UI component.
 */
function useRender<State extends Record<string, any>, RenderedElementType extends Element>(
  settings: useRender.Settings<State, RenderedElementType>,
) {
  const { className, render, state = {}, props, stateAttributesMap } = settings;
  const { ref, ...extraProps } = props ?? {};

  return useComponentRenderer({
    className,
    render,
    state: state as State,
    ref: ref as React.Ref<RenderedElementType>,
    extraProps,
    propGetter: (x) => x,
    customStyleHookMapping: stateAttributesMap,
  });
}

namespace useRender {
  export type RenderProp<State> =
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>
    | keyof typeof defaultRenderFunctions;

  export interface Settings<State, RenderedElementType extends Element> {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    className?: string | ((state: State) => string);
    /**
     * The React element or a function that returns one to override the default element.
     */
    render: RenderProp<State>;
    /**
     * The state of the component. It will be used as a parameter for the render and className callbacks.
     */
    state?: State;
    /**
     * Props to be spread on the rendered element.
     * They are merged with the internal props of the component, so that event handlers
     * are merged, class names and styles are joined, and other external props overwrite the
     * internal ones.
     */
    props?: Record<string, unknown> & { ref?: React.Ref<RenderedElementType> };
    /**
     * An object that maps the state (passed with the `state` parameter) to attributes placed on the rendered component.
     */
    stateAttributesMap?: StateAttributes<State>;
  }
}

export { useRender };
