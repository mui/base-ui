import type * as React from 'react';
import type { BaseUIEvent, ComponentRenderFn, HTMLProps } from '../types';

export type { HTMLProps, BaseUIEvent, ComponentRenderFn };

export interface FloatingUIOpenChangeDetails {
  open: boolean;
  reason: string;
  nativeEvent: Event;
  nested: boolean;
  triggerElement?: Element | undefined;
}

type WithPreventBaseUIHandler<T> = T extends (event: infer E) => any
  ? E extends React.SyntheticEvent<Element, Event>
    ? (event: BaseUIEvent<E>) => ReturnType<T>
    : T
  : T extends undefined
    ? undefined
    : T;

/**
 * Adds a `preventBaseUIHandler` method to event handlers whose key is in `PE`.
 * - `string` (default): all event handlers get `preventBaseUIHandler` — backward compatible.
 * - A concrete union (e.g. `'onClick' | 'onKeyDown'`): only those handlers get `preventBaseUIHandler`.
 * - `never`: no handlers get `preventBaseUIHandler`.
 */
export type WithBaseUIEvent<T, PE extends string = string> = {
  [K in keyof T]: K extends PE ? WithPreventBaseUIHandler<T[K]> : T[K];
};

/**
 * Props shared by all Base UI components.
 * Contains `className` (string or callback taking the component's state as an argument) and `render` (function to customize rendering).
 *
 * @template PreventableEvents Union of event handler keys (e.g. `'onClick' | 'onKeyDown'`) for which
 *   `event.preventBaseUIHandler()` is available.
 *   - `string` (default): all events get `preventBaseUIHandler` — backward compatibility for non-migrated components.
 *   - `never`: no events get `preventBaseUIHandler` — for components with no internal event handlers.
 *   - A concrete union: only those events get `preventBaseUIHandler`.
 */
export type BaseUIComponentProps<
  ElementType extends React.ElementType,
  State,
  PreventableEvents extends string = string,
  RenderFunctionProps = HTMLProps,
> = Omit<
  WithBaseUIEvent<React.ComponentPropsWithRef<ElementType>, PreventableEvents>,
  'className' | 'color' | 'defaultValue' | 'defaultChecked'
> & {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className?: string | ((state: State) => string | undefined) | undefined;
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?: React.ReactElement | ComponentRenderFn<RenderFunctionProps, State> | undefined;
  /**
   * Style applied to the element, or a function that
   * returns a style object based on the component’s state.
   */
  style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined) | undefined;
};

export interface NativeButtonProps {
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default true
   */
  nativeButton?: boolean | undefined;
}

export interface NonNativeButtonProps {
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `true` if the rendered element is a native button.
   * @default false
   */
  nativeButton?: boolean | undefined;
}

/**
 * Simplifies the display of a type (without modifying it).
 * Taken from https://effectivetypescript.com/2022/02/25/gentips-4-display/
 */
export type Simplify<T> = T extends Function ? T : { [K in keyof T]: T[K] };

export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

export type Orientation = 'horizontal' | 'vertical';
