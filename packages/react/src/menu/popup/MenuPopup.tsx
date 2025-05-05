'use client';
import * as React from 'react';
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
import { mergeProps } from '../../merge-props';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';

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
export const MenuPopup = React.forwardRef(function MenuPopup(
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
    mounted,
    instantType,
    onOpenChangeComplete,
  } = useMenuRootContext();
  const { side, align, floatingContext } = useMenuPositionerContext();
  const contextMenuContext = useContextMenuRootContext();
  const hasContextMenuParent = Boolean(contextMenuContext) && !nested;

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
      returnFocus={!hasContextMenuParent}
      initialFocus={nested ? -1 : 0}
    >
      {renderElement()}
    </FloatingFocusManager>
  );
});

export namespace MenuPopup {
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
