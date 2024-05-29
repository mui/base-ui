import * as React from 'react';

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
export type ComponentRenderFn<Props, State> = (props: Props, state: State) => React.ReactElement;

/**
 * Props shared by all Base UI components.
 * Contains `className` (string or callback taking the component's state as an argument) and `render` (function to customize rendering).
 */
export type BaseUIComponentProps<
  ElementType extends React.ElementType,
  OwnerState,
  RenderFunctionProps = React.HTMLAttributes<any>,
> = Omit<WithBaseUIEvent<React.ComponentPropsWithoutRef<ElementType>>, 'className'> & {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className?: string | ((state: OwnerState) => string);
  /**
   * A function to customize rendering of the component.
   */
  render?: ComponentRenderFn<RenderFunctionProps, OwnerState> | React.ReactElement<ElementType>;
};
