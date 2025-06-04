'use client';
import * as React from 'react';
import { FloatingFocusManager, useFloatingTree } from '@floating-ui/react';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuRoot } from '../root/MenuRoot';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { Side } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { EMPTY_OBJ, DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';

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
export const MenuPopup = React.forwardRef(function MenuPopup(
  componentProps: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, finalFocus, ...elementProps } = componentProps;

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

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef],
    customStyleHookMapping,
    props: [
      popupProps,
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJ,
      elementProps,
    ],
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
      returnFocus={finalFocus || returnFocus}
      initialFocus={parent.type === 'menu' ? -1 : 0}
      restoreFocus
    >
      {element}
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
