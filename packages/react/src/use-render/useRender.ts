import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';

/**
 * Returns a function that renders a Base UI component.
 */
function useRender<RenderedElementType extends Element>(
  settings: useRender.Settings<RenderedElementType>,
) {
  const { render, props } = settings;
  const { ref, ...extraProps } = props ?? {};

  return useComponentRenderer({
    render,
    state: {} as Record<string, any>,
    ref: ref as React.Ref<RenderedElementType>,
    extraProps,
  });
}

namespace useRender {
  export type RenderProp<State = Record<string, any>> =
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>
    | keyof typeof defaultRenderFunctions;

  export interface Settings<RenderedElementType extends Element> {
    /**
     * The React element or a function that returns one to override the default element.
     */
    render: RenderProp<Record<string, any>>;
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
