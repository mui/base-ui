'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldLabelProps } from './FieldLabel.types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldLabel } from './useFieldLabel';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

/**
 * A label for the field's control.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldLabel API](https://mui.com/base-ui/react-field/components-api/#field-label)
 */
const FieldLabel = React.forwardRef(function FieldLabel(
  props: FieldLabelProps,
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
