'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, useFloatingTree } from '@floating-ui/react';
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
import { mergeProps } from '../../utils/mergeProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

const customStyleHookMapping: CustomStyleHookMapping<MenuPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

const DISABLED_TRANSITIONS_STYLE = { style: { transition: 'none' } };
const EMPTY_OBJ = {};

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

  const {
    open,
    setOpen,
    popupRef,
    transitionStatus,
    nested,
    popupProps,
    modal,
    mounted,
    instantType,
    onOpenChangeComplete,
  } = useMenuRootContext();
  const { side, align, floatingContext } = useMenuPositionerContext();

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

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
      nested,
      instant: instantType,
    }),
    [transitionStatus, side, align, open, nested, instantType],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    extraProps: mergeProps(
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJ,
      popupProps,
      other,
    ),
    customStyleHookMapping,
    ref: mergedRef,
  });

  return (
    <FloatingFocusManager
      context={floatingContext}
      modal={false}
      disabled={!mounted}
      visuallyHiddenDismiss={modal ? 'Dismiss popup' : undefined}
    >
      {renderElement()}
    </FloatingFocusManager>
  );
});

namespace MenuPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * @ignore
     */
    id?: string;
  }

  export type State = {
    transitionStatus: TransitionStatus;
    side: Side;
    align: 'start' | 'end' | 'center';
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    nested: boolean;
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuPopup };
