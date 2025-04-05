'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useMeterRootContext } from '../root/MeterRootContext';
import { MeterRoot } from '../root/MeterRoot';
import { meterStyleHookMapping } from '../root/styleHooks';
import { BaseUIComponentProps } from '../../utils/types';
/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterLabel = React.forwardRef(function MeterLabel(
  props: MeterLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, id: idProp, ...otherProps } = props;

  const id = useBaseUiId(idProp);

  const { setLabelId, state } = useMeterRootContext();

  useEnhancedEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    state,
    className,
    ref: forwardedRef,
    extraProps: mergeProps<'span'>({ id }, otherProps),
    customStyleHookMapping: meterStyleHookMapping,
  });

  return renderElement();
});

namespace MeterLabel {
  export interface State extends MeterRoot.State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}

export { MeterLabel };

MeterLabel.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
