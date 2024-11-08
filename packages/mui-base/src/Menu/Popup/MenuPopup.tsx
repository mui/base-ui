'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Side, useFloatingTree } from '@floating-ui/react';
import { useMenuPopup } from './useMenuPopup.js';
import { useMenuRootContext } from '../Root/MenuRootContext.js';
import { useMenuPositionerContext } from '../Positioner/MenuPositionerContext.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { useForkRef } from '../../utils/useForkRef.js';
import type { BaseUIComponentProps } from '../../utils/types.js';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';
import type { TransitionStatus } from '../../utils/useTransitionStatus.js';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping.js';

const customStyleHookMapping: CustomStyleHookMapping<MenuPopup.OwnerState> = {
  ...baseMapping,
  transitionStatus(value) {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
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
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuPopup API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuPopup)
 */
const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { open, setOpen, popupRef, transitionStatus } = useMenuRootContext();
  const { side, alignment } = useMenuPositionerContext();
  const { events: menuEvents } = useFloatingTree()!;

  useMenuPopup({
    setOpen,
    menuEvents,
  });

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const ownerState: MenuPopup.OwnerState = React.useMemo(
    () => ({
      transitionStatus,
      side,
      alignment,
      open,
    }),
    [transitionStatus, side, alignment, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    extraProps: other,
    customStyleHookMapping,
    ref: mergedRef,
  });

  return renderElement();
});

namespace MenuPopup {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
    /**
     * The id of the popup element.
     */
    id?: string;
  }

  export type OwnerState = {
    transitionStatus: TransitionStatus;
    side: Side;
    alignment: 'start' | 'end' | 'center';
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
