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
 * Adds a `preventBaseUIHandler` method to all event handlers.
 */
export type WithBaseUIEvent<T> = {
  [K in keyof T]: WithPreventBaseUIHandler<T[K]>;
};

/**
 * Props shared by all Base UI components.
 * Contains `className` (string or callback taking the component's state as an argument) and `render` (function to customize rendering).
 */
export type BaseUIComponentProps<
  ElementType extends React.ElementType,
  State,
  RenderFunctionProps = HTMLProps,
> = Omit<
  WithBaseUIEvent<React.ComponentPropsWithRef<ElementType>>,
  'className' | 'color' | 'defaultValue' | 'defaultChecked' | 'style'
> & {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: State) => string | undefined) | undefined;
  /**
   * Allows you to replace the component's HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?: React.ReactElement | ComponentRenderFn<RenderFunctionProps, State> | undefined;
  /**
   * Style applied to the element, or a function that
   * returns a style object based on the component's state.
   */
  style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined) | undefined;
};

/**
 * Props shared by components whose rendered element is intentionally broad.
 */
export type HTMLElementComponentProps<State> = Omit<
  WithBaseUIEvent<HTMLProps<HTMLElement>>,
  'className' | 'color' | 'defaultValue' | 'defaultChecked' | 'style'
> & {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: State) => string | undefined) | undefined;
  /**
   * Allows you to replace the component's HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?: React.ReactElement | ComponentRenderFn<HTMLProps, State> | undefined;
  /**
   * Style applied to the element, or a function that
   * returns a style object based on the component's state.
   */
  style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined) | undefined;
};

export type NativeButtonAttributeKeys =
  | 'form'
  | 'formAction'
  | 'formEncType'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'name'
  | 'type'
  | 'value';

export type NativeButtonAttributes = Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  NativeButtonAttributeKeys
>;

export interface NativeButtonProps<TNativeButton extends boolean> {
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (for example, `<div>`).
   * @default true
   */
  nativeButton?: TNativeButton | undefined;
}

export interface NonNativeButtonProps<TNativeButton extends boolean> {
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `true` if the rendered element is a native button.
   * @default false
   */
  nativeButton?: TNativeButton | undefined;
}

type NativeButtonProp<
  TNativeButton extends boolean,
  TDefaultNativeButton extends boolean,
> = TDefaultNativeButton extends true
  ? NativeButtonProps<TNativeButton>
  : NonNativeButtonProps<TNativeButton>;

type NativeButtonElementProps<
  TNativeButton extends boolean,
  State,
  TNativeButtonAttributeOverrides extends NativeButtonAttributeKeys,
> = boolean extends TNativeButton
  ? Omit<HTMLElementComponentProps<State>, NativeButtonAttributeKeys | 'disabled' | 'ref'>
  : TNativeButton extends true
    ? Omit<
        BaseUIComponentProps<'button', State>,
        TNativeButtonAttributeOverrides | 'disabled' | 'ref'
      > &
        Omit<NativeButtonAttributes, TNativeButtonAttributeOverrides>
    : Omit<HTMLElementComponentProps<State>, NativeButtonAttributeKeys | 'disabled' | 'ref'>;

export type NativeButtonComponentProps<
  TNativeButton extends boolean,
  TElement extends React.ElementType,
  State,
  TDefaultNativeButton extends boolean = true,
  TNativeButtonAttributeOverrides extends NativeButtonAttributeKeys = never,
> = [TElement] extends [React.ElementType]
  ? NativeButtonProp<TNativeButton, TDefaultNativeButton> &
      NativeButtonElementProps<TNativeButton, State, TNativeButtonAttributeOverrides> & {
        /**
         * Whether the component should ignore user interaction.
         */
        disabled?: boolean | undefined;
      }
  : never;

/**
 * Simplifies the display of a type (without modifying it).
 * Taken from https://effectivetypescript.com/2022/02/25/gentips-4-display/
 */
export type Simplify<T> = T extends Function ? T : { [K in keyof T]: T[K] };

/**
 * Makes specified keys in a type required.
 *
 * @template T - The original type.
 * @template K - The keys to make required.
 */
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

export type Orientation = 'horizontal' | 'vertical';
