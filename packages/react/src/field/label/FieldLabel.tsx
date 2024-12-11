'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldLabel } from './useFieldLabel';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldLabel = React.forwardRef(function FieldLabel(
  props: FieldLabel.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, id: idProp, ...otherProps } = props;

  const { setLabelId, state } = useFieldRootContext(false);

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(undefined);
    };
  }, [id, setLabelId]);

  const { getLabelProps } = useFieldLabel({ customTag: render != null });

  const { renderElement } = useComponentRenderer({
    propGetter: getLabelProps,
    render: render ?? 'label',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return renderElement();
});

namespace FieldLabel {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

FieldLabel.propTypes /* remove-proptypes */ = {
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
   * Allows you to replace the default HTML element that the component
   * renders with another element, or compose it with another component.
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FieldLabel };
