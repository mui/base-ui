'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';
import type { Align, Side } from '../../utils/useAnchorPositioning';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectArrow API](https://base-ui.com/components/react-select/#api-reference-SelectArrow)
 */
const SelectArrow = React.forwardRef(function SelectArrow(
  props: SelectArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open, alignOptionToTrigger } = useSelectRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = useSelectPositionerContext();

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

  const state: SelectArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      arrowUncentered,
    }),
    [open, side, align, arrowUncentered],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: popupOpenStateMapping,
  });

  if (alignOptionToTrigger) {
    return null;
  }

  return renderElement();
});

namespace SelectArrow {
  export interface State {
    open: boolean;
    side: Side | 'none';
    align: Align;
    arrowUncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
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
