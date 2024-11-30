'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldLabel } from './useFieldLabel';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A label for the field's control.
 *
 * Demos:
 *
 * - [Field](https://base-ui.com/components/react-field/)
 *
 * API:
 *
 * - [FieldLabel API](https://base-ui.com/components/react-field/#api-reference-FieldLabel)
 */
const FieldLabel = React.forwardRef(function FieldLabel(
  props: FieldLabel.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, id: idProp, ...otherProps } = props;

  const { setLabelId, state } = useFieldRootContext(false);

  const id = useId(idProp);

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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FieldLabel };
