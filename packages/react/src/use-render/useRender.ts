import * as React from 'react';
import type { ComponentRenderFn } from '../utils/types';
import { HTMLProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';
import { StateAttributesMapping } from '../utils/getStateAttributesProps';

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
  return useRenderElement(params.defaultTagName ?? 'div', params, params);
}

export type UseRenderRenderProp<State = Record<string, unknown>> =
  | ComponentRenderFn<React.HTMLAttributes<any>, State>
  | React.ReactElement<Record<string, unknown>>;

export type UseRenderElementProps<ElementType extends React.ElementType> =
  React.ComponentPropsWithRef<ElementType>;

export type UseRenderComponentProps<
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

export interface UseRenderParameters<
  State,
  RenderedElementType extends Element,
  Enabled extends boolean | undefined,
> {
  /**
   * The React element or a function that returns one to override the default element.
   */
  render?: UseRenderRenderProp<State>;
  /**
   * The ref to apply to the rendered element.
   */
  ref?: React.Ref<RenderedElementType> | React.Ref<RenderedElementType>[];
  /**
   * The state of the component, passed as the second argument to the `render` callback.
   * State properties are automatically converted to data-* attributes.
   */
  state?: State;
  /**
   * Custom mapping for converting state properties to data-* attributes.
   * @example
   * { isActive: (value) => (value ? { 'data-is-active': '' } : null) }
   */
  stateAttributesMapping?: StateAttributesMapping<State>;
  /**
   * Props to be spread on the rendered element.
   * They are merged with the internal props of the component, so that event handlers
   * are merged, `className` strings and `style` properties are joined, while other external props overwrite the
   * internal ones.
   */
  props?: Record<string, unknown>;
  /**
   * If `false`, the hook will skip most of its internal logic and return `null`.
   * This is useful for rendering a component conditionally.
   * @default true
   */
  enabled?: Enabled;
  /**
   * The default tag name to use for the rendered element when `render` is not provided.
   * @default 'div'
   */
  defaultTagName?: keyof React.JSX.IntrinsicElements;
}

export type UseRenderReturnValue<Enabled extends boolean | undefined> = Enabled extends false
  ? null
  : React.ReactElement;

export namespace useRender {
  export type RenderProp<State = Record<string, unknown>> = UseRenderRenderProp<State>;

  export type ElementProps<ElementType extends React.ElementType> =
    UseRenderElementProps<ElementType>;

  export type ComponentProps<
    ElementType extends React.ElementType,
    State = {},
    RenderFunctionProps = HTMLProps,
  > = UseRenderComponentProps<ElementType, State, RenderFunctionProps>;

  export type Parameters<
    State,
    RenderedElementType extends Element,
    Enabled extends boolean | undefined,
  > = UseRenderParameters<State, RenderedElementType, Enabled>;

  export type ReturnValue<Enabled extends boolean | undefined> = UseRenderReturnValue<Enabled>;
}
