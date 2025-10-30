'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { contains } from '../../floating-ui-react/utils';
import { useFloatingTree } from '../../floating-ui-react/index';
import { useMenuRootContext } from '../root/MenuRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps, HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button/useButton';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { findRootOwnerId } from '../utils/findRootOwnerId';

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
    ...elementProps
  } = componentProps;

  const {
    triggerProps: rootTriggerProps,
    disabled: menuDisabled,
    setTriggerElement,
    open,
    allowMouseUpTriggerRef,
    positionerRef,
    parent,
    lastOpenChangeReason,
    rootId,
  } = useMenuRootContext();

  const disabled = disabledProp || menuDisabled;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const allowMouseUpTriggerTimeout = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const handleRef = useMergedRefs(buttonRef, setTriggerElement);
  const { events: menuEvents } = useFloatingTree()!;

  React.useEffect(() => {
    if (!open && parent.type === undefined) {
      allowMouseUpTriggerRef.current = false;
    }
  }, [allowMouseUpTriggerRef, open, parent.type]);

  const handleDocumentMouseUp = useStableCallback((mouseEvent: MouseEvent) => {
    if (!triggerRef.current) {
      return;
    }

    allowMouseUpTriggerTimeout.clear();
    allowMouseUpTriggerRef.current = false;

    const mouseUpTarget = mouseEvent.target as Element | null;

    if (
      contains(triggerRef.current, mouseUpTarget) ||
      contains(positionerRef.current, mouseUpTarget) ||
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

    menuEvents.emit('close', { domEvent: mouseEvent, reason: 'cancel-open' });
  });

  React.useEffect(() => {
    if (open && lastOpenChangeReason === 'trigger-hover') {
      const doc = ownerDocument(triggerRef.current);
      doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
    }
  }, [open, handleDocumentMouseUp, lastOpenChangeReason]);

  const isMenubar = parent.type === 'menubar';

  const getTriggerProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
        isMenubar ? { role: 'menuitem' } : {},
        {
          'aria-haspopup': 'menu' as const,
          ref: handleRef,
          onMouseDown: (event: React.MouseEvent) => {
            if (open) {
              return;
            }

            // mousedown -> mouseup on menu item should not trigger it within 200ms.
            allowMouseUpTriggerTimeout.start(200, () => {
              allowMouseUpTriggerRef.current = true;
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
      handleRef,
      open,
      allowMouseUpTriggerRef,
      allowMouseUpTriggerTimeout,
      handleDocumentMouseUp,
      isMenubar,
    ],
  );

  const state: MenuTrigger.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const ref = [triggerRef, forwardedRef, buttonRef];
  const props = [rootTriggerProps, elementProps, getTriggerProps];

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
