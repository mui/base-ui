'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { SwitchRoot } from '../Root/SwitchRoot';
import { useSwitchRootContext } from '../Root/SwitchRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { styleHookMapping } from '../styleHooks';

/**
 *
 * Demos:
 *
 * - [Switch](https://base-ui.netlify.app/components/react-switch/)
 *
 * API:
 *
 * - [SwitchThumb API](https://base-ui.netlify.app/components/react-switch/#api-reference-SwitchThumb)
 */
const SwitchThumb = React.forwardRef(function SwitchThumb(
  props: SwitchThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...other } = props;

  const { ownerState: fieldOwnerState } = useFieldRootContext();

  const ownerState = useSwitchRootContext();
  const extendedOwnerState = { ...fieldOwnerState, ...ownerState };

  const { renderElement } = useComponentRenderer({
    render: render || 'span',
    className,
    ownerState: extendedOwnerState,
    extraProps: other,
    customStyleHookMapping: styleHookMapping,
    ref: forwardedRef,
  });

  return renderElement();
});

namespace SwitchThumb {
  export type Props = BaseUIComponentProps<'span', OwnerState> & {};

  export interface OwnerState extends SwitchRoot.OwnerState {}
}

SwitchThumb.propTypes /* remove-proptypes */ = {
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

export { SwitchThumb };
