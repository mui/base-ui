import * as React from 'react';
import type { ComponentRenderFn } from './types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import { evaluateRenderProp } from './evaluateRenderProp';
import { useRenderPropForkRef } from './useRenderPropForkRef';
import { defaultRenderFunctions } from './defaultRenderFunctions';

export interface ComponentRendererSettings<OwnerState, RenderedElementType extends Element> {
  /**
   * The class name to apply to the rendered element.
   * Can be a string or a function that accepts the owner state and returns a string.
   */
  className?: string | ((state: OwnerState) => string);
  /**
   * The render prop or React element to override the default element.
   */
  render:
    | ComponentRenderFn<React.HTMLAttributes<any>, OwnerState>
    | React.ReactElement
    | keyof typeof defaultRenderFunctions;
  /**
   * The owner state of the component.
   */
  ownerState: OwnerState;
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
   * A mapping of owner state to style hooks.
   */
  customStyleHookMapping?: CustomStyleHookMapping<OwnerState>;
}

/**
 * Returns a function that renders a Base UI component.
 *
 * @ignore - internal hook.
 */
export function useComponentRenderer<
  OwnerState extends Record<string, any>,
  RenderedElementType extends Element,
>(settings: ComponentRendererSettings<OwnerState, RenderedElementType>) {
  const {
    render: renderProp,
    className: classNameProp,
    ownerState,
    ref,
    propGetter = (props) => props,
    extraProps,
    customStyleHookMapping,
  } = settings;

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = React.useMemo(() => {
    return getStyleHookProps(ownerState, customStyleHookMapping);
  }, [ownerState, customStyleHookMapping]);

  const ownProps: Record<string, any> = {
    ...styleHooks,
    ...extraProps,
    className,
  };

  let resolvedRenderProp:
    | ComponentRenderFn<React.HTMLAttributes<any>, OwnerState>
    | React.ReactElement;

  if (typeof renderProp === 'string') {
    resolvedRenderProp = defaultRenderFunctions[renderProp];
  } else {
    resolvedRenderProp = renderProp;
  }

  const renderedElementProps = propGetter(ownProps);
  const propsWithRef = {
    ...renderedElementProps,
    ref: useRenderPropForkRef(resolvedRenderProp, ref as React.Ref<any>, renderedElementProps.ref),
  };

  const renderElement = () => evaluateRenderProp(resolvedRenderProp, propsWithRef, ownerState);

  return {
    renderElement,
  };
}
