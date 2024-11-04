'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSliderRootContext } from '../Root/SliderRootContext';
import { sliderStyleHookMapping } from '../Root/styleHooks';
import type { SliderRoot } from '../Root/SliderRoot';
import { useSliderOutput } from './useSliderOutput';
/**
 *
 * Demos:
 *
 * - [Slider](https://base-ui.netlify.app/components/react-slider/)
 *
 * API:
 *
 * - [SliderOutput API](https://base-ui.netlify.app/components/react-slider/#api-reference-SliderOutput)
 */
const SliderOutput = React.forwardRef(function SliderOutput(
  props: SliderOutput.Props,
  forwardedRef: React.ForwardedRef<HTMLOutputElement>,
) {
  const { render, className, ...otherProps } = props;

  const { inputIdMap, ownerState, values } = useSliderRootContext();

  const { getRootProps } = useSliderOutput({
    inputIdMap,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'output',
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

export namespace SliderOutput {
  export type Props = BaseUIComponentProps<'output', SliderRoot.OwnerState> & {};
}

export { SliderOutput };

SliderOutput.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
