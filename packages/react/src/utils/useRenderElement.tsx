import * as React from 'react';
import type { BaseUIComponentProps, ComponentRenderFn, HTMLProps } from './types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { useForkRef } from './useForkRef';
import { resolveClassName } from './resolveClassName';
import { evaluateRenderProp } from './evaluateRenderProp';
import { isReactVersionAtLeast } from './reactVersion';
import { mergeProps } from '../merge-props';

function tag(Tag: string) {
  return function render(props: HTMLProps) {
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
  TagName extends keyof React.JSX.IntrinsicElements | undefined,
>(
  element: TagName,
  componentProps: useRenderElement.ComponentProps<State>,
  params: useRenderElement.Parameters<State, RenderedElementType, TagName> = {},
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

  let refs: React.Ref<RenderedElementType>[] = [];
  if (ref !== undefined) {
    refs = Array.isArray(ref) ? ref : [ref];
  }

  const outProps: React.HTMLAttributes<any> & React.RefAttributes<any> = propGetter({
    ...styleHooks,
    ...(Array.isArray(props) ? mergeProps(...props) : props),
  });

  outProps.ref = useForkRef(outProps.ref, getChildRef(render), ...refs);

  if (className !== undefined) {
    outProps.className = className;
  }

  return () => evaluateRenderProp(render, outProps, state);
}

function getChildRef<ElementType extends React.ElementType, State>(
  render: BaseUIComponentProps<ElementType, State>['render'],
): React.RefCallback<any> | null {
  if (typeof render !== 'function') {
    return isReactVersionAtLeast(19) ? render.props.ref : render.ref;
  } else {
    return null;
  }
}

type RenderFunctionProps<TagName> = TagName extends keyof React.JSX.IntrinsicElements
  ? React.JSX.IntrinsicElements[TagName]
  : React.HTMLAttributes<any>;

export namespace useRenderElement {
  export interface Parameters<State, RenderedElementType extends Element, TagName> {
    /**
     * @deprecated
     */
    propGetter?: (externalProps: HTMLProps) => HTMLProps;
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
      | RenderFunctionProps<TagName>
      | Array<
          | RenderFunctionProps<TagName>
          | ((props: RenderFunctionProps<TagName>) => RenderFunctionProps<TagName>)
        >;
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
