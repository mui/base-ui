'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { HTMLElementType } from '../../utils/proptypes';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectBackdrop } from './useSelectBackdrop';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

const customStyleHookMapping: CustomStyleHookMapping<SelectBackdrop.State> = {
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
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectBackdrop API](https://base-ui.com/components/react-select/#api-reference-SelectBackdrop)
 */
const SelectBackdrop = React.forwardRef(function SelectBackdrop(
  props: SelectBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, keepMounted = false, container, ...otherProps } = props;

  const { open, mounted, transitionStatus } = useSelectRootContext();

  const { getBackdropProps } = useSelectBackdrop();

  const state: SelectBackdrop.State = React.useMemo(
    () => ({
      open,
      hidden: !mounted,
      transitionStatus,
    }),
    [open, mounted, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getBackdropProps,
    render: render ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{renderElement()}</FloatingPortal>;
});

namespace SelectBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * If `true`, the Backdrop remains mounted when the Select popup is closed.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * The container element to which the Backdrop is appended to.
     * @default false
     */
    container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
  }

  export interface State {
    open: boolean;
    hidden: boolean;
    transitionStatus: TransitionStatus;
  }
}

SelectBackdrop.propTypes /* remove-proptypes */ = {
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
   * The container element to which the Backdrop is appended to.
   * @default false
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * If `true`, the Backdrop remains mounted when the Select popup is closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectBackdrop };
