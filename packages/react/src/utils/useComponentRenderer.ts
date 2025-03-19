import * as React from 'react';
import type { ComponentRenderFn } from './types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import { evaluateRenderProp } from './evaluateRenderProp';
import { useRenderPropForkRef } from './useRenderPropForkRef';

interface ComponentProps<State> {
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

export interface ComponentRendererSettings<State, RenderedElementType extends Element> {
  /**
   * The render prop or React element to override the default element.
   */
  render?:
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>;
  /**
   * The state of the component.
   */
  state: State;
  /**
   * The ref to apply to the rendered element.
   */
  ref?: React.Ref<RenderedElementType> | React.Ref<RenderedElementType>[];
  /**
   * Props to be spread on the rendered element.
   */
  props?: Record<string, unknown>;
  /**
   * A mapping of state to style hooks.
   */
  customStyleHookMapping?: CustomStyleHookMapping<State>;
  /**
   * If true, style hooks are generated.
   */
  styleHooks?: boolean;
}

const emptyObject = {};

/**
 * Returns a function that renders a Base UI component.
 *
 * @ignore - internal hook.
 */
export function useComponentRenderer<
  State extends Record<string, any>,
  RenderedElementType extends Element,
>(props: ComponentProps<State>, settings: ComponentRendererSettings<State, RenderedElementType>) {
  const { className: classNameProp, render } = props;
  const {
    state,
    ref,
    props: extraProps,
    customStyleHookMapping,
    styleHooks: generateStyleHooks = true,
  } = settings;

  const className = resolveClassName(classNameProp, state);
  const styleHooks = React.useMemo(() => {
    if (!generateStyleHooks) {
      return emptyObject;
    }
    return getStyleHookProps(state, customStyleHookMapping);
  }, [state, customStyleHookMapping, generateStyleHooks]);

  const ownProps: Record<string, any> = {
    ...styleHooks,
    ...extraProps,
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

  const renderElement = () => evaluateRenderProp(render, propsWithRef, state);

  return {
    renderElement,
  };
}
