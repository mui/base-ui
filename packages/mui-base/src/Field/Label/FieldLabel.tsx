'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { FieldRoot } from '../Root/FieldRoot.js';
import { useFieldRootContext } from '../Root/FieldRootContext.js';
import { useFieldLabel } from './useFieldLabel.js';
import { STYLE_HOOK_MAPPING } from '../utils/constants.js';
import { useId } from '../../utils/useId.js';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect.js';
import type { BaseUIComponentProps } from '../../utils/types.js';

/**
 * A label for the field's control.
 *
 * Demos:
 *
 * - [Field](https://base-ui.netlify.app/components/react-field/)
 *
 * API:
 *
 * - [FieldLabel API](https://base-ui.netlify.app/components/react-field/#api-reference-FieldLabel)
 */
const FieldLabel = React.forwardRef(function FieldLabel(
  props: FieldLabel.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, id: idProp, ...otherProps } = props;

  const { setLabelId, ownerState } = useFieldRootContext(false);

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
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return renderElement();
});

namespace FieldLabel {
  export type OwnerState = FieldRoot.OwnerState;

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
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
