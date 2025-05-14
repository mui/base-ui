'use client';
import * as React from 'react';
import { FloatingFocusManager, useFloatingTree } from '@floating-ui/react';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuRoot } from '../root/MenuRoot';
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
  const { render, className, finalFocus, ...other } = props;

  const {
    open,
    setOpen,
    popupRef,
    transitionStatus,
    popupProps,
    mounted,
    instantType,
    onOpenChangeComplete,
    parent,
    lastOpenChangeReason,
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

  React.useEffect(() => {
    function handleClose(event: {
      domEvent: Event | undefined;
      reason: MenuRoot.OpenChangeReason | undefined;
    }) {
      setOpen(false, event.domEvent, event.reason);
    }

    menuEvents.on('close', handleClose);

    return () => {
      menuEvents.off('close', handleClose);
    };
  }, [menuEvents, setOpen]);

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const state: MenuPopup.State = React.useMemo(
    () => ({
      transitionStatus,
      side,
      align,
      open,
      nested: parent.type === 'menu',
      instant: instantType,
    }),
    [transitionStatus, side, align, open, parent.type, instantType],
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

  let returnFocus = parent.type === undefined || parent.type === 'context-menu';
  if (parent.type === 'menubar' && lastOpenChangeReason !== 'outside-press') {
    returnFocus = true;
  }

  return (
    <FloatingFocusManager
      context={floatingContext}
      modal={false}
      disabled={!mounted}
      returnFocus={returnFocus}
      initialFocus={parent.type === 'menu' ? -1 : 0}
      restoreFocus
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
    /**
     * Determines the element to focus when the menu is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
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
