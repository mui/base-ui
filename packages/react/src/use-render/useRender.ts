import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { HTMLProps } from '../utils/types';
import { useRenderElementLazy } from '../utils/useRenderElement';

/**
 * Returns an object with a `renderElement` function that renders a Base UI element.
 *
 * @public
 */
export function useRender<
  State extends Record<string, unknown>,
  RenderedElementType extends Element,
>(params: useRender.Parameters<State, RenderedElementType>): useRender.ReturnValue {
  const { render, props, state, refs } = params;
  const { ref: intrinsicRefProp, ...intrinsicProps } = props || {};

  const renderElement = useRenderElementLazy(
    undefined,
    { render },
    {
      props: intrinsicProps,
      state,
      ref: [intrinsicRefProp, ...(refs || [])].filter(
        (x): x is React.Ref<RenderedElementType> => x != null,
      ),
      disableStyleHooks: true,
    },
  );

  return {
    renderElement,
  };
}

export namespace useRender {
  export type RenderProp<State = Record<string, unknown>> =
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>;

  export type ElementProps<ElementType extends React.ElementType> =
    React.ComponentPropsWithRef<ElementType>;

  export type ComponentProps<
    ElementType extends React.ElementType,
    State = {},
    RenderFunctionProps = HTMLProps,
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
     * Refs to be merged together to access the rendered DOM element.
     */
    refs?: React.Ref<RenderedElementType>[];
    /**
     * The state of the component, passed as the second argument to the `render` callback.
     */
    state?: State;
    /**
     * Props to be spread on the rendered element.
     * They are merged with the internal props of the component, so that event handlers
     * are merged, `className` strings and `style` properties are joined, while other external props overwrite the
     * internal ones.
     */
    props?: Record<string, unknown> & { ref?: React.Ref<RenderedElementType> };
  }

  export interface ReturnValue {
    renderElement: () => React.ReactElement;
  }
}
