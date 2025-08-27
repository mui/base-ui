'use client';
import * as React from 'react';
import type { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { FloatingFocusManager, useFloatingTree } from '../../floating-ui-react';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuRoot } from '../root/MenuRoot';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { EMPTY_OBJECT, DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

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
    triggerElement,
    onOpenChangeComplete,
    parent,
    lastOpenChangeReason,
    rootId,
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
      reason: MenuRoot.ChangeEventReason;
    }) {
      setOpen(false, createBaseUIEventDetails(event.reason, event.domEvent));
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
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
      { 'data-rootownerid': rootId } as Record<string, string>,
    ],
  });

  let returnFocus = parent.type === undefined || parent.type === 'context-menu';
  if (triggerElement || (parent.type === 'menubar' && lastOpenChangeReason !== 'outside-press')) {
    returnFocus = true;
  }

  return (
    <FloatingFocusManager
      context={floatingContext}
      modal={false}
      disabled={!mounted}
      returnFocus={finalFocus === undefined ? returnFocus : finalFocus}
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
     *
     * - `null`: Do not focus any element.
     * - `RefObject`: Focus the ref element. Falls back to default behavior when `null`.
     * - `function`: Return the element to focus. Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`) that caused the close. Falls back to default behavior when `null` is returned, or does nothing when `void` is returned.
     */
    finalFocus?:
      | null
      | React.RefObject<HTMLElement | null>
      | ((closeType: InteractionType) => HTMLElement | null | void);
  }

  export type State = {
    transitionStatus: TransitionStatus;
    side: Side;
    align: Align;
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    nested: boolean;
  };
}
