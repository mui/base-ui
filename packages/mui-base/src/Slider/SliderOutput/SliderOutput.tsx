'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderContext } from '../Root/SliderProvider';
import { sliderStyleHookMapping } from '../Root/styleHooks';
import { SliderOutputProps } from './SliderOutput.types';
import { useSliderOutput } from './useSliderOutput';

function defaultRender(props: React.ComponentPropsWithRef<'output'>) {
  return <output {...props} />;
}

const SliderOutput = React.forwardRef(function SliderOutput(
  props: SliderOutputProps,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;

  const render = renderProp ?? defaultRender;

  const { ownerState, subitems, values } = useSliderContext();

  const { getRootProps } = useSliderOutput({
    subitems,
    rootRef: forwardedRef,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render,
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: {
      children: values.join(' – '),
      ...otherProps,
    },
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return renderElement();
});

SliderOutput.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SliderOutput };
