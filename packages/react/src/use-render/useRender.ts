import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';
import { CustomStyleHookMapping } from '../utils/getStyleHookProps';

/**
 * Returns a function that renders a Base UI component.
 */
function useRender<State extends Record<string, unknown>, RenderedElementType extends Element>(
  settings: useRender.Settings<State, RenderedElementType>,
) {
  const { render, props, state } = settings;
  const { ref, ...extraProps } = props ?? {};

  const customStyleHookMapping = React.useMemo(() => {
    return Object.keys(state ?? {}).reduce((acc, key) => {
      acc[key as keyof State] = () => null;
      return acc;
    }, {} as CustomStyleHookMapping<State>);
  }, [state]);

  return useComponentRenderer({
    render,
    state: (state ?? {}) as State,
    ref: ref as React.Ref<RenderedElementType>,
    extraProps,
    customStyleHookMapping,
  });
}

namespace useRender {
  export type RenderProp<State = Record<string, unknown>> =
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>
    | keyof typeof defaultRenderFunctions;

  export interface Settings<State, RenderedElementType extends Element> {
    /**
     * The React element or a function that returns one to override the default element.
     */
    render: RenderProp<State>;
    /**
     * The state of the component. It will be used as a parameter for the render callback.
     */
    state?: State;
    /**
     * Props to be spread on the rendered element.
     * They are merged with the internal props of the component, so that event handlers
     * are merged, class names and styles are joined, and other external props overwrite the
     * internal ones.
     */
    props?: Record<string, unknown> & { ref?: React.Ref<RenderedElementType> };
  }
}

export { useRender };
