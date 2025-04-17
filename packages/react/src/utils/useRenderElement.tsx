import * as React from 'react';
import type { ComponentRenderFn, GenericHTMLProps } from './types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import { evaluateRenderProp } from './evaluateRenderProp';
import { useRenderPropForkRef } from './useRenderPropForkRef';
import { mergeProps } from '../merge-props';

function tag(Tag: string) {
  return function render(props: GenericHTMLProps) {
    if (Tag === 'button') {
      return <button type="button" {...props} />;
    }
    if (Tag === 'img') {
      return <img alt="" {...props} />;
    }
    return <Tag {...props} />;
  };
}

const emptyObject = {};

/**
 * Returns a function that renders a Base UI element.
 */
export function useRenderElement<
  State extends Record<string, any>,
  RenderedElementType extends Element,
>(
  element: keyof React.JSX.IntrinsicElements | undefined,
  componentProps: useRenderElement.ComponentProps<State>,
  params: useRenderElement.Parameters<State, RenderedElementType> = {},
) {
  const { className: classNameProp, render: renderProp } = componentProps;
  const {
    propGetter = (props) => props,
    state = emptyObject as State,
    ref,
    props,
    customStyleHookMapping,
    styleHooks: generateStyleHooks = true,
  } = params;
  const render = renderProp || (typeof element === 'string' ? tag(element) : element);

  const className = resolveClassName(classNameProp, state);
  const styleHooks = React.useMemo(() => {
    if (!generateStyleHooks) {
      return emptyObject;
    }
    return getStyleHookProps(state, customStyleHookMapping);
  }, [state, customStyleHookMapping, generateStyleHooks]);

  const ownProps: Record<string, any> = propGetter({
    ...styleHooks,
    ...(Array.isArray(props) ? mergeProps(...props) : props),
  });

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
     * @deprecated
     */
    propGetter?: (externalProps: GenericHTMLProps) => GenericHTMLProps;
    /**
     * The state of the component.
     */
    state?: State;
    /**
     * The ref to apply to the rendered element.
     */
    ref?: React.Ref<RenderedElementType> | React.Ref<RenderedElementType>[];
    /**
     * Intrinsic props to be spread on the rendered element.
     */
    props?:
      | GenericHTMLProps
      | Array<GenericHTMLProps | ((props: GenericHTMLProps) => GenericHTMLProps)>;
    /**
     * A mapping of state to style hooks.
     */
    customStyleHookMapping?: CustomStyleHookMapping<State>;
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
      | undefined
      | ComponentRenderFn<React.HTMLAttributes<any>, State>
      | React.ReactElement<Record<string, unknown>>;
  }
}
