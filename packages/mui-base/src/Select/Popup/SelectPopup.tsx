'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useSelectPositionerContext } from '../Positioner/SelectPositionerContext';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectPopup } from './useSelectPopup';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.OwnerState> = {
  ...popupOpenStateMapping,
  transitionStatus(value): Record<string, string> | null {
    if (value === 'entering') {
      return { 'data-entering': '' };
    }

    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }

    return null;
  },
};

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectPopup API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectPopup)
 */
const SelectPopup = React.forwardRef(function SelectPopup(
  props: SelectPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...otherProps } = props;
  const { open, popupRef, transitionStatus } = useSelectRootContext();
  const { side, alignment } = useSelectPositionerContext();

  const { getPopupProps } = useSelectPopup();

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const ownerState: SelectPopup.OwnerState = React.useMemo(
    () => ({
      transitionStatus,
      side,
      alignment,
      open,
    }),
    [transitionStatus, side, alignment, open],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getPopupProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    ownerState,
    customStyleHookMapping,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectPopup {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
    /**
     * The id of the popup element.
     */
    id?: string;
  }

  export interface OwnerState {
    side: Side | 'none';
    alignment: 'start' | 'end' | 'center';
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}

SelectPopup.propTypes /* remove-proptypes */ = {
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
   * The id of the popup element.
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectPopup };
