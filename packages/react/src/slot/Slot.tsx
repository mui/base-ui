'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { useForkRef } from '../utils';
import type { ComponentRenderFn } from '../utils/types';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';
import { CustomStyleHookMapping as StateDataAttributes } from '../utils/getStyleHookProps';

const Slot = React.forwardRef(function SlotComponent<
  State extends Record<string, any>,
  RenderedElementType extends Element,
>(
  inProps: Slot.Props<State, RenderedElementType>,
  forwardedRef: React.ForwardedRef<RenderedElementType>,
) {
  const { className, render = <div />, state = {} as State, props, stateDataAttributes } = inProps;
  const { ref, ...extraProps } = props ?? {};
  const finalRef = useForkRef(ref, forwardedRef);

  const { renderElement } = useComponentRenderer<State, RenderedElementType>({
    className,
    render,
    state,
    ref: finalRef as React.Ref<RenderedElementType>,
    extraProps,
    propGetter: (x) => x,
    customStyleHookMapping: stateDataAttributes,
  });

  return renderElement();
});

type RenderProp<State> =
  | ComponentRenderFn<React.HTMLAttributes<any>, State>
  | React.ReactElement<Record<string, unknown>>
  | keyof typeof defaultRenderFunctions;

namespace Slot {
  export interface Props<State extends Record<string, any>, RenderedElementType extends Element> {
    /**
     * The class name to apply to the rendered element.
     * Can be a string or a function that accepts the state and returns a string.
     */
    className?: string | ((state: State) => string);
    /**
     * The render prop or React element to override the default element.
     */
    render?: RenderProp<State>;
    /**
     * The state of the component. It will be used as a parameter for the render and className callbacks.
     */
    state?: State;
    /**
     * Props to be spread on the rendered element.
     */
    props?: Record<string, unknown> & { ref?: React.Ref<RenderedElementType> };
    /**
     * A mapping of state to data attributes.
     */
    stateDataAttributes?: StateDataAttributes<State>;
  }
}

export { Slot };

Slot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The state of the component. It will be used as a parameter for the render and className callbacks.
   */
  state: PropTypes.object,
  /**
   * Props to be spread on the rendered element.
   */
  props: PropTypes.object,
} as any;
