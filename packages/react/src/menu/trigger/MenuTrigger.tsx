'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { contains } from '../../floating-ui-react/utils';
import {
  safePolygon,
  useClick,
  useFloatingTree,
  useHover,
  useInteractions,
} from '../../floating-ui-react/index';
import {
  FloatingTreeStore,
  useFloatingNodeId,
  useFloatingParentNodeId,
} from '../../floating-ui-react/components/FloatingTree';
import { useMenuRootContext } from '../root/MenuRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps, HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button/useButton';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { findRootOwnerId } from '../utils/findRootOwnerId';
import { useTriggerRegistration } from '../../utils/popupStoreUtils';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { REASONS } from '../../utils/reasons';
import { useMixedToggleClickHandler } from '../../utils/useMixedToggleClickHander';
import { MenuHandle } from '../store/MenuHandle';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { useMenubarContext } from '../../menubar/MenubarContext';
import { MenuParent } from '../root/MenuRoot';

const BOUNDARY_OFFSET = 2;

/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuTrigger = React.forwardRef(function MenuTrigger(
  componentProps: MenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    id: idProp,
    openOnHover: openOnHoverProp,
    delay = 100,
    closeDelay = 0,
    handle,
    payload,
    ...elementProps
  } = componentProps;

  const rootContext = useMenuRootContext(true);
  const store = handle?.store ?? rootContext?.store;
  if (!store) {
    throw new Error(
      'Base UI: <Menu.Trigger> must be either used within a <Menu.Root> component or provided with a handle.',
    );
  }

  const contextMenuContext = useContextMenuRootContext(true);
  const parentContext = useMenuRootContext(true);
  const menubarContext = useMenubarContext(true);

  const parent: MenuParent = React.useMemo(() => {
    if (menubarContext) {
      return {
        type: 'menubar',
        context: menubarContext,
      };
    }

    // Ensure this is not a Menu nested inside ContextMenu.Trigger.
    // ContextMenu parentContext is always undefined as ContextMenu.Root is instantiated with
    // <MenuRootContext.Provider value={undefined}>
    if (contextMenuContext && !parentContext) {
      return {
        type: 'context-menu',
        context: contextMenuContext,
      };
    }

    return {
      type: undefined,
    };
  }, [contextMenuContext, parentContext, menubarContext]);

  const rootActiveTriggerProps = store.useState('activeTriggerProps');
  const rootInactiveTriggerProps = store.useState('inactiveTriggerProps');
  const menuDisabled = store.useState('disabled');
  const floatingRootContext = store.useState('floatingRootContext');
  const hoverEnabled = store.useState('hoverEnabled');

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);

  const disabled = disabledProp || menuDisabled;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const allowMouseUpTriggerTimeout = useTimeout();

  const floatingTreeRootFromContext = useFloatingTree();
  const floatingTreeRoot: FloatingTreeStore = React.useMemo(() => {
    return floatingTreeRootFromContext ?? new FloatingTreeStore();
  }, [floatingTreeRootFromContext]);

  const floatingNodeId = useFloatingNodeId(floatingTreeRoot);
  const floatingParentNodeId = useFloatingParentNodeId();

  const thisTriggerId = useBaseUiId(idProp);
  const registerTrigger = useTriggerRegistration(thisTriggerId, store);

  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);

  useIsoLayoutEffect(() => {
    if (isTriggerActive) {
      store.update({
        floatingTreeRoot,
        parent,
        floatingNodeId,
        floatingParentNodeId,
      });
    }
  }, [isTriggerActive, store, floatingTreeRoot, parent, floatingNodeId, floatingParentNodeId]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  React.useEffect(() => {
    if (!isOpenedByThisTrigger && parent.type === undefined) {
      store.context.allowMouseUpTriggerRef.current = false;
    }
  }, [store, isOpenedByThisTrigger, parent.type]);

  const handleDocumentMouseUp = useStableCallback((mouseEvent: MouseEvent) => {
    if (!triggerRef.current) {
      return;
    }

    allowMouseUpTriggerTimeout.clear();
    store.context.allowMouseUpTriggerRef.current = false;

    const mouseUpTarget = mouseEvent.target as Element | null;

    if (
      contains(triggerRef.current, mouseUpTarget) ||
      contains(store.select('positionerElement'), mouseUpTarget) ||
      mouseUpTarget === triggerRef.current
    ) {
      return;
    }

    if (mouseUpTarget != null && findRootOwnerId(mouseUpTarget) === store.select('rootId')) {
      return;
    }

    const bounds = getPseudoElementBounds(triggerRef.current);

    if (
      mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET &&
      mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET &&
      mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET &&
      mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET
    ) {
      return;
    }

    floatingTreeRoot.events.emit('close', { domEvent: mouseEvent, reason: REASONS.cancelOpen });
  });

  React.useEffect(() => {
    if (isOpenedByThisTrigger && store.select('lastOpenChangeReason') === REASONS.triggerHover) {
      const doc = ownerDocument(triggerRef.current);
      doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
    }
  }, [isOpenedByThisTrigger, handleDocumentMouseUp, store]);

  const openOnHover =
    openOnHoverProp ?? (parent.type === 'menubar' && parent.context.hasSubmenuOpen);

  const hover = useHover(floatingRootContext, {
    enabled:
      hoverEnabled &&
      openOnHover &&
      !disabled &&
      parent.type !== 'context-menu' &&
      (parent.type !== 'menubar' || (parent.context.hasSubmenuOpen && !isOpenedByThisTrigger)),
    handleClose: safePolygon({ blockPointerEvents: parent.type !== 'menubar' }),
    mouseOnly: true,
    move: false,
    restMs: parent.type === undefined ? delay : undefined,
    delay: { close: closeDelay },
    triggerElement,
    externalTree: floatingTreeRoot,
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled && parent.type !== 'context-menu',
    event: isOpenedByThisTrigger && parent.type === 'menubar' ? 'click' : 'mousedown',
    toggle: true,
    ignoreMouse: false,
    stickIfOpen: parent.type === undefined ? store.select('stickIfOpen') : false,
  });

  const mixedToggleHandlers = useMixedToggleClickHandler({
    open: isOpenedByThisTrigger,
    enabled: parent.type === 'menubar',
    mouseDownAction: 'open',
  });

  const localInteractionProps = useInteractions([click, hover]);

  const isMenubar = parent.type === 'menubar';

  const getTriggerProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
        isMenubar ? { role: 'menuitem' } : {},
        {
          'aria-haspopup': 'menu' as const,
          ref: buttonRef,
          onMouseDown: (event: React.MouseEvent) => {
            if (store.select('open')) {
              return;
            }

            // mousedown -> mouseup on menu item should not trigger it within 200ms.
            allowMouseUpTriggerTimeout.start(200, () => {
              store.context.allowMouseUpTriggerRef.current = true;
            });

            const doc = ownerDocument(event.currentTarget);
            doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
          },
        },
        externalProps,
        getButtonProps,
      );
    },
    [
      getButtonProps,
      allowMouseUpTriggerTimeout,
      handleDocumentMouseUp,
      isMenubar,
      store,
      buttonRef,
    ],
  );

  const state: MenuTrigger.State = React.useMemo(
    () => ({
      disabled,
      open: isOpenedByThisTrigger,
    }),
    [disabled, isOpenedByThisTrigger],
  );

  useIsoLayoutEffect(() => {
    if (isTriggerActive) {
      store.set('payload', payload);
    }
  }, [isTriggerActive, payload, store]);

  const ref = [triggerRef, forwardedRef, buttonRef, registerTrigger, setTriggerElement];
  const props = [
    localInteractionProps.getReferenceProps(),
    isTriggerActive ? rootActiveTriggerProps : rootInactiveTriggerProps,
    // TODO: figure out why 'aria-expanded' from useRole doesn't work
    { id: thisTriggerId, 'aria-expanded': isOpenedByThisTrigger ? 'true' : 'false' },
    mixedToggleHandlers,
    elementProps,
    getTriggerProps,
  ];

  const element = useRenderElement('button', componentProps, {
    enabled: !isMenubar,
    stateAttributesMapping: pressableTriggerOpenStateMapping,
    state,
    ref,
    props,
  });

  if (isMenubar) {
    return (
      <CompositeItem
        tag="button"
        render={render}
        className={className}
        state={state}
        refs={ref}
        props={props}
        stateAttributesMapping={pressableTriggerOpenStateMapping}
      />
    );
  }

  return element;
}) as MenuTrigger;

export interface MenuTrigger {
  <Payload>(
    componentProps: MenuTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface MenuTriggerProps<Payload = unknown>
  extends NativeButtonProps,
    BaseUIComponentProps<'button', MenuTrigger.State> {
  children?: React.ReactNode;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * A handle to associate the trigger with a menu.
   */
  handle?: MenuHandle<Payload>;
  /**
   * A payload to pass to the menu when it is opened.
   */
  payload?: Payload;
  /**
   * How long to wait before the menu may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 100
   */
  delay?: number;
  /**
   * How long to wait before closing the menu that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay?: number;
  /**
   * Whether the menu should also open when the trigger is hovered.
   */
  openOnHover?: boolean;
}

export type MenuTriggerState = {
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
};

export namespace MenuTrigger {
  export type Props<Payload = unknown> = MenuTriggerProps<Payload>;
  export type State = MenuTriggerState;
}
