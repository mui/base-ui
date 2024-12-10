'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFloatingTree } from '@floating-ui/react';
import { useMenuPopup } from './useMenuPopup';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { Side } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

const customStyleHookMapping: CustomStyleHookMapping<MenuPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { open, setOpen, popupRef, transitionStatus } = useMenuRootContext();
  const { side, align } = useMenuPositionerContext();
  const { events: menuEvents } = useFloatingTree()!;

  useMenuPopup({
    setOpen,
    menuEvents,
  });

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const state: MenuPopup.State = React.useMemo(
    () => ({
      transitionStatus,
      side,
      align,
      open,
    }),
    [transitionStatus, side, align, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    extraProps: mergeReactProps(other, {
      style: transitionStatus === 'entering' ? { transition: 'none' } : {},
    }),
    customStyleHookMapping,
    ref: mergedRef,
  });

  return renderElement();
});

namespace MenuPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * The id of the popup element.
     */
    id?: string;
  }

  export type State = {
    transitionStatus: TransitionStatus;
    side: Side;
    align: 'start' | 'end' | 'center';
    open: boolean;
  };
}

MenuPopup.propTypes /* remove-proptypes */ = {
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

export { MenuPopup };
