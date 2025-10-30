'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { contains } from '../../floating-ui-react/utils';
import {
  safePolygon,
  useClick,
  useFloatingTree,
  useHover,
  useInteractions,
} from '../../floating-ui-react/index';
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
    openOnHover: openOnHoverProp = false,
    delay = 100,
    closeDelay = 0,
    ...elementProps
  } = componentProps;

  const { store } = useMenuRootContext();

  const rootActiveTriggerProps = store.useState('activeTriggerProps');
  const rootInactiveTriggerProps = store.useState('inactiveTriggerProps');
  const menuDisabled = store.useState('disabled');
  const open = store.useState('open');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const rootId = store.useState('rootId');
  const parent = store.useState('parent');
  const activeTrigger = store.useState('activeTriggerElement');
  const floatingRootContext = store.useState('floatingRootContext');
  const hoverEnabled = store.useState('hoverEnabled');
  const allowMouseEnter = store.useState('allowMouseEnter');
  const stickIfOpen = store.useState('stickIfOpen');

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const isTriggerActive = activeTrigger === triggerElement;

  const disabled = disabledProp || menuDisabled;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const allowMouseUpTriggerTimeout = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const { events: menuEvents } = useFloatingTree()!;

  React.useEffect(() => {
    if (!open && parent.type === undefined) {
      store.context.allowMouseUpTriggerRef.current = false;
    }
  }, [store, open, parent.type]);

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

    if (mouseUpTarget != null && findRootOwnerId(mouseUpTarget) === rootId) {
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

    menuEvents.emit('close', { domEvent: mouseEvent, reason: REASONS.cancelOpen });
  });

  React.useEffect(() => {
    if (open && lastOpenChangeReason === REASONS.triggerHover) {
      const doc = ownerDocument(triggerRef.current);
      doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
    }
  }, [open, handleDocumentMouseUp, lastOpenChangeReason]);

  const openOnHover =
    openOnHoverProp ??
    (parent.type === 'menu' || (parent.type === 'menubar' && parent.context.hasSubmenuOpen));

  const hover = useHover(floatingRootContext, {
    enabled:
      hoverEnabled &&
      openOnHover &&
      !disabled &&
      parent.type !== 'context-menu' &&
      (parent.type !== 'menubar' || (parent.context.hasSubmenuOpen && !open)),
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    move: parent.type === 'menu',
    restMs:
      parent.type === undefined || (parent.type === 'menu' && allowMouseEnter) ? delay : undefined,
    delay:
      parent.type === 'menu'
        ? { open: allowMouseEnter ? delay : 10 ** 10, close: closeDelay }
        : { close: closeDelay },
    triggerElement,
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled && parent.type !== 'context-menu',
    event: open && parent.type === 'menubar' ? 'click' : 'mousedown',
    toggle: !openOnHover || parent.type !== 'menu',
    ignoreMouse: openOnHover && parent.type === 'menu',
    stickIfOpen: parent.type === undefined ? stickIfOpen : false,
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
            if (open) {
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
      open,
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
      open,
    }),
    [disabled, open],
  );

  const id = useBaseUiId(idProp);
  const registerTrigger = useTriggerRegistration(id, store);

  const ref = [triggerRef, forwardedRef, buttonRef, registerTrigger, setTriggerElement];
  const props = [
    localInteractionProps.getReferenceProps(),
    isTriggerActive ? rootActiveTriggerProps : rootInactiveTriggerProps,
    { id },
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
});

export interface MenuTriggerProps
  extends NativeButtonProps,
    BaseUIComponentProps<'button', MenuTrigger.State> {
  children?: React.ReactNode;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
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
  export type Props = MenuTriggerProps;
  export type State = MenuTriggerState;
}
