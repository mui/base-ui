'use client';
import * as React from 'react';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMenuFilterImpl } from '../filter-root/MenuFilterContext';
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
import { useRenderedId } from '../../internals/resolveRenderedId';
import { resolvePopupLabel } from '../../internals/resolvePopupLabel';

interface MenuPopupPlainProps extends MenuPopup.Props {
  /** A filter root's own initial focus target; the plain default focuses the popup or its list. */
  initialFocus?: FloatingFocusManagerProps['initialFocus'] | undefined;
  /** Whether a filter root traps focus in the popup. */
  modal?: boolean | undefined;
}

export const MenuPopupPlain = React.forwardRef(function MenuPopup(
  componentProps: MenuPopupPlainProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    style,
    finalFocus,
    id: idProp,
    initialFocus: initialFocusProp,
    modal: modalProp = false,
    ...elementProps
  } = componentProps;

  const rootContext = useMenuRootContext();
  const { store, defaultFloatingId, setFloatingId, virtualFocus, orientation } = rootContext;
  const inheritedSubmenuRootContext = useMenuSubmenuRootContext();
  const { side, align } = useMenuPositionerContext();
  const insideToolbar = useToolbarRootContext(true) != null;

  const open = store.useState('open');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const mounted = store.useState('mounted');
  const instantType = store.useState('instantType');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const parent = store.useState('parent');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const rootId = store.useState('rootId');
  const floatingContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const closeDelay = store.useState('closeDelay');
  const hoverEnabled = store.useState('hoverEnabled');
  const disabled = store.useState('disabled');
  const openMethod = store.useState('openMethod');
  const activeTriggerId = store.useState('activeTriggerId');
  const listElement = store.useState('listElement');

  const [id, registerIdRef] = useRenderedId(componentProps, defaultFloatingId, setFloatingId);
  const { ariaLabelledBy } = resolvePopupLabel(
    componentProps,
    activeTriggerElement,
    activeTriggerId,
  );

  // A dialog's menu can render under a submenu provider; only the actual submenu inherits it.
  const submenuRootContext = parent.type === 'menu' ? inheritedSubmenuRootContext : undefined;
  const isContextMenu = parent.type === 'context-menu';

  let initialFocus: FloatingFocusManagerProps['initialFocus'] =
    initialFocusProp ?? parent.type !== 'menu';
  if (initialFocusProp === undefined && listElement && parent.type !== 'menu') {
    initialFocus = () => {
      // A keyboard or screen reader open highlights an item, which list navigation focuses.
      if (store.state.activeIndex !== null) {
        return false;
      }
      // The list holds the `menu` role, so a pointer open lands focus on it rather than on the
      // presentational popup.
      return listElement;
    };
  }

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

  const setPopupElement = store.useStateSetter('popupElement');

  // A virtually focused parent keeps real focus on its input, so its submenu trigger never blurs.
  // Real focus entering a plain submenu is the equivalent moment: the parent has no active item
  // until a keyboard close hands the cursor back to the trigger.
  const parentStore = parent.type === 'menu' ? parent.store : null;
  const parentFocusRef = parentStore?.context.virtualFocusRef;
  const returnToParentInput = useStableCallback((closeType: InteractionType) => {
    if (closeType === 'keyboard') {
      parentStore?.highlightItem(activeTriggerElement, REASONS.keyboard);
    }
    return parentFocusRef?.current ?? null;
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
    ref: [forwardedRef, store.context.popupRef, setPopupElement, registerIdRef],
    stateAttributesMapping: popupTransitionStateMapping,
    props: [
      popupProps,
      {
        id,
        // A rendered `Menu.List` carries the `menu` semantics instead.
        ...(listElement
          ? { role: 'presentation' }
          : {
              role: 'menu',
              // `menu` is implicitly vertical, so only the non-default value needs to be
              // rendered.
              'aria-orientation': orientation === 'horizontal' ? 'horizontal' : undefined,
              'aria-labelledby': ariaLabelledBy,
            }),
        onKeyDown(event) {
          submenuRootContext?.onPopupKeyDown?.(event);
          if (insideToolbar && COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }
        },
        onFocus() {
          if (!virtualFocus && parentFocusRef && parentStore?.state.activeIndex != null) {
            parentStore.setActiveIndex(null, REASONS.none);
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

  // Internal defaults rather than consumer targets, so focus that already moved is respected.
  const dynamicReturnFocus =
    submenuRootContext?.getReturnElement ?? (parentFocusRef ? returnToParentInput : undefined);

  return (
    <FloatingFocusManager
      context={floatingContext}
      openInteractionType={openMethod}
      modal={isContextMenu || modalProp}
      disabled={!mounted}
      returnFocus={finalFocus ?? dynamicReturnFocus ?? returnFocus}
      explicitReturnFocus={finalFocus === undefined && dynamicReturnFocus ? false : undefined}
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

/**
 * A container for the menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const Popup = useMenuFilterImpl()?.Popup ?? MenuPopupPlain;
  return <Popup {...props} ref={forwardedRef} />;
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
