'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectPositionerContext } from '../Positioner/SelectPositionerContext';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { BaseUIComponentProps } from '../../utils/types';
import { commonStyleHooks } from '../utils/commonStyleHooks';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectArrow API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectArrow)
 */
const SelectArrow = React.forwardRef(function SelectArrow(
  props: SelectArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open, alignOptionToTrigger } = useSelectRootContext();
  const { arrowRef, side, alignment, arrowUncentered, arrowStyles } = useSelectPositionerContext();

  const getArrowProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        style: {
          ...arrowStyles,
          ...(hideWhenUncentered && arrowUncentered ? { visibility: 'hidden' } : {}),
        },
      }),
    [arrowStyles, hideWhenUncentered, arrowUncentered],
  );

  const ownerState: SelectArrow.OwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      arrowUncentered,
    }),
    [open, side, alignment, arrowUncentered],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: commonStyleHooks,
  });

  if (alignOptionToTrigger) {
    return null;
  }

  return renderElement();
});

namespace SelectArrow {
  export interface OwnerState {
    open: boolean;
    side: 'top' | 'bottom' | 'left' | 'right' | 'none';
    alignment: 'start' | 'center' | 'end';
    arrowUncentered: boolean;
  }
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
     * @default false
     */
    hideWhenUncentered?: boolean;
  }
}

SelectArrow.propTypes /* remove-proptypes */ = {
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
   * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectArrow };
