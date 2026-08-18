'use client';
import * as React from 'react';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FloatingFocusManager, useHoverFloatingInteraction } from '../../floating-ui-react';
import type { FloatingFocusManagerProps } from '../../floating-ui-react/components/FloatingFocusManager';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuRoot } from '../root/MenuRoot';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import type { Side, Align } from '../../internals/useAnchorPositioning';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { popupTransitionStateMapping } from '../../utils/popupStateMapping';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useToolbarRootContext } from '../../toolbar/root/ToolbarRootContext';
import { COMPOSITE_KEYS } from '../../internals/composite/composite';
import { getDisabledMountTransitionStyles } from '../../internals/getDisabledMountTransitionStyles';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';

/**
 * A container for the menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuPopup = React.forwardRef(function MenuPopup(
  componentProps: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store, floatingId, setFloatingId } = useMenuRootContext();
  const id = componentProps.id ?? floatingId;
  const { finalFocus, render, className, style, ...elementProps } = componentProps;

  const submenuRootContext = useMenuSubmenuRootContext();
  const { side, align } = useMenuPositionerContext();
  const insideToolbar = useToolbarRootContext(true) != null;

  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const instantType = store.useState('instantType');
  const activeTriggerId = store.useState('activeTriggerId');
  const parent = store.useState('parent');
  const rootId = store.useState('rootId');
  const setPopupElement = store.useStateSetter('popupElement');
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const floatingContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const openMethod = store.useState('openMethod');
  const openedByKeyboard = store.useState('openedByKeyboard');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const closeDelay = store.useState('closeDelay');
  const hoverEnabled = store.useState('hoverEnabled');
  const disabled = store.useState('disabled');

  const virtualFocus = store.select('virtualFocus');

  const isContextMenu = parent.type === 'context-menu';
  const shouldFocusPopup = parent.type !== 'menu' || openedByKeyboard;
  // Under virtual focus the popup itself is never the focus target: a child element holds real
  // focus and the list is navigated with `aria-activedescendant`.
  let initialFocus: FloatingFocusManagerProps['initialFocus'] = shouldFocusPopup;
  if (shouldFocusPopup && virtualFocus) {
    initialFocus = store.context.inputRef;
  }

  // Unconditional, so removing the prop releases the override instead of latching.
  useIsoLayoutEffect(() => {
    setFloatingId(componentProps.id);
  }, [componentProps.id, setFloatingId]);

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  React.useEffect(() => {
    function handleClose(event: {
      domEvent: Event | undefined;
      reason: MenuRoot.ChangeEventReason;
    }) {
      store.setOpen(false, createChangeEventDetails(event.reason, event.domEvent));
    }

    floatingTreeRoot.events.on('close', handleClose);

    return () => {
      floatingTreeRoot.events.off('close', handleClose);
    };
  }, [floatingTreeRoot.events, store]);

  useHoverFloatingInteraction(floatingContext, {
    enabled: hoverEnabled && !disabled && !isContextMenu && parent.type !== 'menubar',
    closeDelay,
  });

  const state: MenuPopupState = {
    transitionStatus,
    side,
    align,
    open,
    nested: parent.type === 'menu',
    instant: instantType,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    stateAttributesMapping: popupTransitionStateMapping,
    props: [
      popupProps,
      {
        id,
        role: 'menu',
        // Read the id off the element rather than the registration: a `render` element's own
        // `id` wins in the DOM, and pointing at the registered id would reference nothing.
        'aria-labelledby': activeTriggerElement?.id ?? activeTriggerId ?? undefined,
        onKeyDown(event) {
          submenuRootContext?.onPopupKeyDown(event);
          if (insideToolbar && COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }
        },
      },
      getDisabledMountTransitionStyles(transitionStatus),
      elementProps,
      { 'data-rootownerid': rootId } as Record<string, string>,
    ],
  });

  let returnFocus = parent.type === undefined || isContextMenu;
  if (
    activeTriggerElement ||
    (parent.type === 'menubar' && lastOpenChangeReason !== REASONS.outsidePress)
  ) {
    returnFocus = true;
  }

  const resolvedReturnFocus = submenuRootContext?.getReturnElement ?? returnFocus;

  return (
    <FloatingFocusManager
      context={floatingContext}
      openInteractionType={openMethod}
      modal={isContextMenu}
      disabled={!mounted}
      returnFocus={finalFocus === undefined ? resolvedReturnFocus : finalFocus}
      initialFocus={initialFocus}
      restoreFocus
      externalTree={parent.type !== 'menubar' ? floatingTreeRoot : undefined}
      previousFocusableElement={activeTriggerElement as HTMLElement | null}
      nextFocusableElement={
        parent.type === undefined ? store.context.triggerFocusTargetRef : undefined
      }
      beforeContentFocusGuardRef={
        parent.type === undefined ? store.context.beforeContentFocusGuardRef : undefined
      }
    >
      {element}
    </FloatingFocusManager>
  );
});

export interface MenuPopupProps extends BaseUIComponentProps<'div', MenuPopupState> {
  children?: React.ReactNode;
  /**
   * @ignore
   */
  id?: string | undefined;
  /**
   * Determines the element to focus when the menu is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((closeType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
}

export interface MenuPopupState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
  /**
   * Whether the component is nested.
   */
  nested: boolean;
  /**
   * Whether transitions should be skipped.
   */
  instant: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined;
}

export namespace MenuPopup {
  export type Props = MenuPopupProps;
  export type State = MenuPopupState;
}
