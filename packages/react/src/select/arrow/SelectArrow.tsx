'use client';
import * as React from 'react';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { mergeProps } from '../../merge-props';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

const customStyleHookMapping: CustomStyleHookMapping<SelectArrow.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * Displays an element positioned against the select menu anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectArrow = React.forwardRef(function SelectArrow(
  props: SelectArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, alignItemToTrigger } = useSelectRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = useSelectPositionerContext();

  const getArrowProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          style: arrowStyles,
          'aria-hidden': true,
        },
        externalProps,
      ),
    [arrowStyles],
  );

  const state: SelectArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      uncentered: arrowUncentered,
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
    customStyleHookMapping,
  });

  if (alignItemToTrigger) {
    return null;
  }

  return renderElement();
});

namespace SelectArrow {
  export interface State {
    /**
     * Whether the select menu is currently open.
     */
    open: boolean;
    side: Side | 'none';
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { SelectArrow };
