import * as React from 'react';
import type { ComponentRenderFn } from './types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import { evaluateRenderProp } from './evaluateRenderProp';
import { useRenderPropForkRef } from './useRenderPropForkRef';
import { defaultRenderFunctions } from './defaultRenderFunctions';

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
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>
    | keyof typeof defaultRenderFunctions;
  /**
   * The state of the component.
   */
  state: State;
  /**
   * The ref to apply to the rendered element.
   */
  ref?: React.Ref<RenderedElementType>;
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
  customStyleHookMapping?: CustomStyleHookMapping<State>;
}

/**
 * Returns a function that renders a Base UI component.
 *
 * @ignore - internal hook.
 */
export function useComponentRenderer<
  State extends Record<string, any>,
  RenderedElementType extends Element,
>(settings: ComponentRendererSettings<State, RenderedElementType>) {
  const {
    render: renderProp,
    className: classNameProp,
    state,
    ref,
    propGetter = (props) => props,
    extraProps,
    customStyleHookMapping,
  } = settings;

  const className = resolveClassName(classNameProp, state);
  const styleHooks = React.useMemo(() => {
    return getStyleHookProps(state, customStyleHookMapping);
  }, [state, customStyleHookMapping]);

  const ownProps: Record<string, any> = {
    ...styleHooks,
    ...extraProps,
  };

  let resolvedRenderProp:
    | ComponentRenderFn<React.HTMLAttributes<any>, State>
    | React.ReactElement<Record<string, unknown>>;

  if (typeof renderProp === 'string') {
    resolvedRenderProp = defaultRenderFunctions[renderProp];
  } else {
    resolvedRenderProp = renderProp;
  }

  const renderedElementProps = propGetter(ownProps);
  const propsWithRef: React.HTMLAttributes<any> & React.RefAttributes<any> = {
    ...renderedElementProps,
    ref: useRenderPropForkRef(resolvedRenderProp, ref as React.Ref<any>, renderedElementProps.ref),
  };
  if (className !== undefined) {
    propsWithRef.className = className;
  }

  const renderElement = () => evaluateRenderProp(resolvedRenderProp, propsWithRef, state);

  return {
    renderElement,
  };
}
