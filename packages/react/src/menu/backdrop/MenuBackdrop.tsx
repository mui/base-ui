'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

const customStyleHookMapping: CustomStyleHookMapping<MenuBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuBackdrop = React.forwardRef(function MenuBackdrop(
  props: MenuBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, keepMounted = false, ...other } = props;
  const { open, mounted, transitionStatus } = useMenuRootContext();

  const state: MenuBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: { role: 'presentation', hidden: !mounted, ...other },
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace MenuBackdrop {
  export interface State {
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * If `true`, the backdrop remains mounted when the menu popup is closed.
     * @default false
     */
    keepMounted?: boolean;
  }
}

MenuBackdrop.propTypes /* remove-proptypes */ = {
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
   * If `true`, the backdrop remains mounted when the menu popup is closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuBackdrop };
