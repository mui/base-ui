import * as React from 'react';
import type { BaseUIComponentProps, ComponentRenderFn, GenericHTMLProps } from './types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import { evaluateRenderProp } from './evaluateRenderProp';
import { useRenderPropForkRef } from './useRenderPropForkRef';
import { tag } from './renderFunctions';
import { mergeProps } from '../merge-props';

type Tag = keyof React.JSX.IntrinsicElements;
type AllowedTags = Exclude<Tag, 'button' | 'img'>;

const emptyObject = {};

/**
 * Returns a function that renders a Base UI element.
 *
 * @ignore - internal hook.
 */
export function useRenderElement<
  State extends Record<string, any>,
  RenderedElementType extends Element,
>(
  element: AllowedTags | ((props: GenericHTMLProps) => React.ReactElement),
  props: useRenderElement.ComponentProps<State>,
  params: useRenderElement.Parameters<State, RenderedElementType> = {},
) {
  const { className: classNameProp, render: renderProp } = props;
  const {
    state = emptyObject as State,
    ref,
    props: extraProps,
    styleHookMapping,
    styleHooks: generateStyleHooks = true,
  } = params;
  const render = renderProp || (typeof element === 'string' ? tag(element) : element);

  const className = resolveClassName(classNameProp, state);
  const styleHooks = React.useMemo(() => {
    if (!generateStyleHooks) {
      return emptyObject;
    }
    return getStyleHookProps(state, styleHookMapping);
  }, [state, styleHookMapping, generateStyleHooks]);

  const ownProps: Record<string, any> = {
    ...styleHooks,
    ...(Array.isArray(extraProps) ? mergeProps(...extraProps) : extraProps),
  };

  let refs: React.Ref<RenderedElementType>[] = [];

  if (ref !== undefined) {
    refs = Array.isArray(ref) ? ref : [ref];
  }

  const propsWithRef: React.HTMLAttributes<any> & React.RefAttributes<any> = {
    ...ownProps,
    ref: useRenderPropForkRef(render, ownProps.ref, ...refs),
  };
  if (className !== undefined) {
    propsWithRef.className = className;
  }

  return () => evaluateRenderProp(render, propsWithRef, state);
}

export namespace useRenderElement {
  export interface Parameters<State, RenderedElementType extends Element> {
    /**
     * The element's tag or function that returns a React element.
     */
    element?: AllowedTags | ((props: GenericHTMLProps) => React.ReactElement);
    /**
     * The state of the component.
     */
    state?: State;
    /**
     * The ref to apply to the rendered element.
     */
    ref?: React.Ref<RenderedElementType> | React.Ref<RenderedElementType>[];
    /**
     * Props to be spread on the rendered element.
     */
    props?:
      | BaseUIComponentProps<any, State>
      | Array<BaseUIComponentProps<any, State>>
      | ((props: GenericHTMLProps) => GenericHTMLProps)
      | Array<(props: GenericHTMLProps) => GenericHTMLProps>;
    /**
     * A mapping of state to style hooks.
     */
    styleHookMapping?: CustomStyleHookMapping<State>;
    /**
     * If true, style hooks are generated.
     */
    styleHooks?: boolean;
  }

  export interface ComponentProps<State> {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    className?: string | ((state: State) => string);
    /**
     * The render prop or React element to override the default element.
     */
    render?:
      | ComponentRenderFn<React.HTMLAttributes<any>, State>
      | React.ReactElement<Record<string, unknown>>;
  }
}
