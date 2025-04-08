'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStyleHookMapping } from '../root/styleHooks';
import type { ProgressRoot } from '../root/ProgressRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An accessible label for the progress bar.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressLabel = React.forwardRef(function ProgressLabel(
  props: ProgressLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, id: idProp, ...otherProps } = props;

  const id = useBaseUiId(idProp);

  const { setLabelId, state } = useProgressRootContext();

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
    customStyleHookMapping: progressStyleHookMapping,
  });

  return renderElement();
});

namespace ProgressLabel {
  export interface Props extends BaseUIComponentProps<'span', ProgressRoot.State> {}
}

export { ProgressLabel };

ProgressLabel.propTypes /* remove-proptypes */ = {
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
