import * as React from 'react';

export type EventHandlers = Record<string, React.EventHandler<any>>;

export type GenericHTMLProps = React.HTMLAttributes<any> & { ref?: React.Ref<any> | undefined };

export type BaseUIEvent<E extends React.SyntheticEvent<Element, Event>> = E & {
  preventBaseUIHandler: () => void;
};

type WithPreventBaseUIHandler<T> = T extends (event: infer E) => any
  ? E extends React.SyntheticEvent<Element, Event>
    ? (event: BaseUIEvent<E>) => ReturnType<T>
    : T
  : T extends undefined
    ? undefined
    : T;

/**
 * Adds a `preventBaseUIHandler` method to all event handlers.
 */
export type WithBaseUIEvent<T> = {
  [K in keyof T]: WithPreventBaseUIHandler<T[K]>;
};

/**
 * Shape of the render prop: a function that takes props to be spread on the element and component's state and returns a React element.
 *
 * @template Props Props to be spread on the rendered element.
 * @template State Component's internal state.
 */
export type ComponentRenderFn<Props, State> = (
  props: Props,
  state: State,
) => React.ReactElement<unknown>;

/**
 * Props shared by all Base UI components.
 * Contains `className` (string or callback taking the component's state as an argument) and `render` (function to customize rendering).
 */
export type BaseUIComponentProps<
  ElementType extends React.ElementType,
  State,
  RenderFunctionProps = React.HTMLAttributes<any>,
> = Omit<WithBaseUIEvent<React.ComponentPropsWithoutRef<ElementType>>, 'className'> & {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className?: string | ((state: State) => string);
  /**
   * A function to customize rendering of the component.
   */
  render?:
    | ComponentRenderFn<RenderFunctionProps, State>
    | React.ReactElement<Record<string, unknown>>;
};

/**
 * Simplifies the display of a type (without modifying it).
 * Taken from https://effectivetypescript.com/2022/02/25/gentips-4-display/
 */
export type Simplify<T> = T extends Function ? T : { [K in keyof T]: T[K] };

export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;
