import * as React from 'react';
import type { ComponentRenderFn } from './BaseUI.types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { resolveClassName } from './resolveClassName';
import { evaluateRenderProp } from './evaluateRenderProp';

export interface BaseUIComponentRendererSettings<OwnerState, RenderedElementType extends Element> {
  /**
   * The class name to apply to the rendered element.
   * Can be a string or a function that accepts the owner state and returns a string.
   */
  className?: string | ((state: OwnerState) => string);
  /**
   * The render prop or React element to override the default element.
   */
  render: ComponentRenderFn<React.HTMLAttributes<any>, OwnerState> | React.ReactElement;
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
  propGetter?: (externalProps: Record<string, any>) => React.HTMLAttributes<any>;
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
export function useBaseUIComponentRenderer<
  OwnerState extends Record<string, any>,
  RenderedElementType extends Element,
>(settings: BaseUIComponentRendererSettings<OwnerState, RenderedElementType>) {
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

  const renderedElementProps = propGetter({
    ...styleHooks,
    ...extraProps,
    className,
    ref,
  });

  const renderElement = () => evaluateRenderProp(renderProp, renderedElementProps, ownerState);

  return {
    renderElement,
  };
}
