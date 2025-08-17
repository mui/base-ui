import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { HTMLProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';

/**
 * Renders a Base UI element.
 *
 * @public
 */
export function useRender<
  State extends Record<string, unknown>,
  RenderedElementType extends Element,
  Enabled extends boolean | undefined = undefined,
>(
  params: useRender.Parameters<State, RenderedElementType, Enabled>,
): useRender.ReturnValue<Enabled> {
  const { dataset, ...otherParams } = params;
  
  const renderParams = otherParams as useRender.Parameters<State, RenderedElementType, Enabled> & {
    disableStyleHooks: boolean;
  };
  renderParams.disableStyleHooks = true;
  
  if (dataset) {
    renderParams.props = { ...renderParams.props, ...dataset };
  }

  return useRenderElement(undefined, renderParams, renderParams);
}

export namespace useRender {
  /**
   * Dataset attributes that can be applied to the rendered element.
   * All keys must start with 'data-' prefix.
   */
  export type DatasetProps = {
    [K in `data-${string}`]?: string | number | boolean | undefined;
  };

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

  export interface Parameters<
    State,
    RenderedElementType extends Element,
    Enabled extends boolean | undefined,
  > {
    /**
     * The React element or a function that returns one to override the default element.
     */
    render: RenderProp<State>;
    /**
     * The ref to apply to the rendered element.
     */
    ref?: React.Ref<RenderedElementType> | React.Ref<RenderedElementType>[];
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
    props?: Record<string, unknown>;
    /**
     * Dataset attributes to be applied to the rendered element.
     * All keys must start with 'data-' prefix.
     */
    dataset?: DatasetProps;
    /**
     * If `false`, the hook will skip most of its internal logic and return `null`.
     * This is useful for rendering a component conditionally.
     * @default true
     */
    enabled?: Enabled;
  }

  export type ReturnValue<Enabled extends boolean | undefined> = Enabled extends false
    ? null
    : React.ReactElement;
}
