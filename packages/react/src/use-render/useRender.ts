import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';
import { GenericHTMLProps } from '../utils/types';

const emptyObject = {};

/**
 * Returns a function that renders a Base UI component.
 */
export function useRender<
  State extends Record<string, unknown>,
  RenderedElementType extends Element,
>(settings: useRender.Parameters<State, RenderedElementType>) {
  const { render, props, state, refs } = settings;
  const { ref, ...extraProps } = props ?? {};

  const refsArray = React.useMemo(() => {
    return [...(refs ?? []), ref].filter(Boolean);
  }, [refs, ref]) as React.Ref<RenderedElementType>[];

  return useComponentRenderer({
    render,
    state: (state ?? emptyObject) as State,
    ref: refsArray,
    extraProps,
    skipGeneratingStyleHooks: true,
  });
}

export namespace useRender {
  export type RenderProp<State = Record<string, unknown>> =
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>
    | keyof typeof defaultRenderFunctions;

  export type ElementProps<
    ElementType extends React.ElementType,
    State = {},
    RenderFunctionProps = GenericHTMLProps,
  > = React.ComponentPropsWithRef<ElementType> & {
    /**
     * Allows you to replace the component’s HTML element
     * with a different tag, or compose it with another component.
     *
     * Accepts a `ReactElement` or a function that returns the element to render.
     */
    render?:
      | ComponentRenderFn<RenderFunctionProps, State>
      | React.ReactElement<Record<string, unknown>>;
  };

  export interface Parameters<State, RenderedElementType extends Element> {
    /**
     * The React element or a function that returns one to override the default element.
     */
    render: RenderProp<State>;
    /**
     * The refs to apply to the rendered element.
     */
    refs?: React.Ref<RenderedElementType>[];
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
