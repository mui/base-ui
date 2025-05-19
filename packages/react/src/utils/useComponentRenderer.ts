import * as React from 'react';
import { StateAttributesMapping } from './mapStateAttributes';
import { useRenderElementLazy } from './useRenderElement';
import type { ComponentRenderFn, HTMLProps } from './types';

export interface ComponentRendererSettings<State, RenderedElementType extends Element> {
  /**
   * The class name to apply to the rendered element.
   * Can be a string or a function that accepts the state and returns a string.
   */
  className?: string | ((state: State) => string);
  /**
   * The render prop or React element to override the default element.
   */
  render:
    | ComponentRenderFn<HTMLProps, State>
    | React.ReactElement<Record<string, unknown>>
    | keyof React.JSX.IntrinsicElements;
  /**
   * The state of the component.
   */
  state: State;
  /**
   * The ref to apply to the rendered element.
   */
  ref?: React.Ref<RenderedElementType> | React.Ref<RenderedElementType>[];
  /**
   * A function that returns props for the rendered element.
   * It should accept and merge additional props.
   */
  propGetter?: (
    externalProps: Record<string, any>,
  ) => React.HTMLAttributes<any> & React.RefAttributes<RenderedElementType>;
  /**
   * Additional props to be spread on the rendered element.
   */
  extraProps?: Record<string, any>;
  /**
   * A mapping of state to style hooks.
   */
  stateAttributesMapping?: StateAttributesMapping<State>;
  /**
   * If true, style hooks are generated.
   */
  stateAttributesMapping?: boolean;
}

/**
 * Returns a function that renders a Base UI component.
 * @deprecated use `useRenderElement` instead.
 */
export function useComponentRenderer<
  State extends Record<string, any>,
  RenderedElementType extends Element,
>(params: ComponentRendererSettings<State, RenderedElementType>) {
  const renderString = typeof params.render === 'string' ? params.render : undefined;
  const renderProp = typeof params.render === 'string' ? undefined : params.render;

  const renderElement = useRenderElementLazy(
    renderString,
    { className: params.className, render: renderProp },
    { ...params, props: params.extraProps },
  );

  return {
    renderElement,
  };
}
