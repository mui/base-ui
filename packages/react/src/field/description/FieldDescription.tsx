'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldDescription } from './useFieldDescription';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A description message for the field's control.
 *
 * Demos:
 *
 * - [Field](https://base-ui.com/components/react-field/)
 *
 * API:
 *
 * - [FieldDescription API](https://base-ui.com/components/react-field/#api-reference-FieldDescription)
 */
const FieldDescription = React.forwardRef(function FieldDescription(
  props: FieldDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, id, className, ...otherProps } = props;

  const { state } = useFieldRootContext(false);

  const { getDescriptionProps } = useFieldDescription({ id });

  const { renderElement } = useComponentRenderer({
    propGetter: getDescriptionProps,
    render: render ?? 'p',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return renderElement();
});

namespace FieldDescription {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'p', State> {}
}

FieldDescription.propTypes /* remove-proptypes */ = {
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

export { FieldDescription };
