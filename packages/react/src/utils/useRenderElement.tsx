import * as React from 'react';
import type { BaseUIComponentProps, ComponentRenderFn, HTMLProps } from './types';
import { CustomStyleHookMapping, getStyleHookProps } from './getStyleHookProps';
import { useForkRef, useForkRefN } from './useForkRef';
import { resolveClassName } from './resolveClassName';
import { isReactVersionAtLeast } from './reactVersion';
import { mergeProps, mergePropsN } from '../merge-props';
import { mergeObjects } from './mergeObjects';

type IntrinsicTagName = keyof React.JSX.IntrinsicElements;

const EMPTY_OBJECT = {};
const IDENTITY = (x: any) => x;

/**
 * Render a Base UI element.
 */
export function useRenderElement<
  State extends Record<string, any>,
  RenderedElementType extends Element,
  TagName extends IntrinsicTagName | undefined,
>(
  element: TagName,
  componentProps: useRenderElement.ComponentProps<State>,
  params: useRenderElement.Parameters<State, RenderedElementType, TagName> = {},
) {
  const renderProp = componentProps.render;
  const outProps = useRenderElementProps(componentProps, params);
  const state = params.state ?? (EMPTY_OBJECT as State);
  return evaluateRenderProp(element, renderProp, outProps, state);
}

/**
 * Returns a function that renders a Base UI element.
 */
export function useRenderElementLazy<
  State extends Record<string, any>,
  RenderedElementType extends Element,
  TagName extends IntrinsicTagName | undefined,
>(
  element: TagName,
  componentProps: useRenderElement.ComponentProps<State>,
  params: useRenderElement.Parameters<State, RenderedElementType, TagName> = {},
) {
  const renderProp = componentProps.render;
  const outProps = useRenderElementProps(componentProps, params);
  const state = params.state ?? (EMPTY_OBJECT as State);
  return () => evaluateRenderProp(element, renderProp, outProps, state);
}

/**
 * Computes render element final props.
 */
function useRenderElementProps<
  State extends Record<string, any>,
  RenderedElementType extends Element,
  TagName extends IntrinsicTagName | undefined,
>(
  componentProps: useRenderElement.ComponentProps<State>,
  params: useRenderElement.Parameters<State, RenderedElementType, TagName> = {},
) {
  const { className: classNameProp, render: renderProp } = componentProps;

  const {
    propGetter = IDENTITY,
    state = EMPTY_OBJECT as State,
    ref,
    props,
    disableStyleHooks,
    customStyleHookMapping,
  } = params;

  const className = resolveClassName(classNameProp, state);

  let styleHooks: Record<string, string> | undefined;
  if (disableStyleHooks !== true) {
    // SAFETY: We use typings to ensure `disableStyleHooks` is either always set or
    // always unset, so this `if` block is stable across renders.
    /* eslint-disable-next-line react-hooks/rules-of-hooks */
    styleHooks = React.useMemo(
      () => getStyleHookProps(state, customStyleHookMapping),
      [state, customStyleHookMapping],
    );
  }

  const outProps: React.HTMLAttributes<any> & React.RefAttributes<any> = propGetter(
    mergeObjects(styleHooks, Array.isArray(props) ? mergePropsN(props) : props) ?? EMPTY_OBJECT,
  );

  // SAFETY: The `useForkRef` functions use a single hook to store the same value,
  // switching between them at runtime is safe. If this assertion fails, React will
  // throw at runtime anyway.
  /* eslint-disable react-hooks/rules-of-hooks */
  if (Array.isArray(ref)) {
    outProps.ref = useForkRefN(outProps.ref, getChildRef(renderProp), ...ref);
  } else {
    outProps.ref = useForkRef(outProps.ref, getChildRef(renderProp), ref);
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  if (className !== undefined) {
    outProps.className = className;
  }

  return outProps;
}

function evaluateRenderProp<T extends React.ElementType, S>(
  element: IntrinsicTagName | undefined,
  render: BaseUIComponentProps<T, S>['render'],
  props: React.HTMLAttributes<any> & React.RefAttributes<any>,
  state: S,
): React.ReactElement<Record<string, unknown>> {
  if (render) {
    if (typeof render === 'function') {
      return render(props, state);
    }
    const mergedProps = mergeProps(props, render.props);
    mergedProps.ref = props.ref;
    return React.cloneElement(render, mergedProps);
  }
  if (element) {
    if (typeof element === 'string') {
      return renderTag(element, props);
    }
  }
  // Unreachable, but the typings on `useRenderElement` need to be reworked
  // to annotate it correctly.
  throw new Error('Need either element or render to be defined');
}

function renderTag(Tag: string, props: Record<string, any>) {
  if (Tag === 'button') {
    return <button type="button" {...props} />;
  }
  if (Tag === 'img') {
    return <img alt="" {...props} />;
  }
  return React.createElement(Tag, props);
}

function getChildRef<ElementType extends React.ElementType, State>(
  render: BaseUIComponentProps<ElementType, State>['render'],
): React.RefCallback<any> | null {
  if (render && typeof render !== 'function') {
    return isReactVersionAtLeast(19) ? render.props.ref : render.ref;
  }
  return null;
}

type RenderFunctionProps<TagName> = TagName extends keyof React.JSX.IntrinsicElements
  ? React.JSX.IntrinsicElements[TagName]
  : React.HTMLAttributes<any>;

export namespace useRenderElement {
  export type Parameters<State, RenderedElementType extends Element, TagName> = {
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
  } /* This typing ensures `disableStyleHookMapping` is constantly defined or undefined */ & (
    | {
        /**
         * Disable style hook mapping.
         */
        disableStyleHooks: true;
      }
    | {
        /**
         * Disable style hook mapping.
         */
        disableStyleHooks?: false;
      }
  );

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
