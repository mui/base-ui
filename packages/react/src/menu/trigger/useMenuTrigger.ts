'use client';
import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../use-button/useButton';
import { useForkRef } from '../../utils/useForkRef';
import { HTMLProps } from '../../utils/types';
import { useTimeout } from '../../utils/useTimeout';
import { mergeProps } from '../../merge-props';
import { ownerDocument } from '../../utils/owner';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { useMenuRoot, type MenuOpenChangeReason } from '../root/useMenuRoot';
import { useEventCallback } from '../../utils/useEventCallback';

export function useMenuTrigger(parameters: useMenuTrigger.Parameters): useMenuTrigger.ReturnValue {
  const BOUNDARY_OFFSET = 2;

  const {
    disabled = false,
    rootRef: externalRef,
    open,
    setOpen,
    setTriggerElement,
    positionerRef,
    allowMouseUpTriggerRef,
    menuParent,
    lastOpenChangeReason,
  } = parameters;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useForkRef(externalRef, triggerRef);
  const allowMouseUpTriggerTimeout = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: mergedRef,
  });

  const handleRef = useForkRef(buttonRef, setTriggerElement);

  React.useEffect(() => {
    if (!open && menuParent.type === undefined) {
      allowMouseUpTriggerRef.current = false;
    }
  }, [allowMouseUpTriggerRef, open, menuParent.type]);

  const handleMouseUp = useEventCallback((mouseEvent: MouseEvent) => {
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

    const bounds = getPseudoElementBounds(triggerRef.current);

    if (
      mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET &&
      mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET &&
      mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET &&
      mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET
    ) {
      return;
    }

    setOpen(false, mouseEvent, 'cancel-open');
  });

  React.useEffect(() => {
    if (open && lastOpenChangeReason === 'trigger-hover') {
      const doc = ownerDocument(triggerRef.current);
      doc.addEventListener('mouseup', handleMouseUp, { once: true });
    }
  }, [open, handleMouseUp, lastOpenChangeReason]);

  const getTriggerProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps(
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
            doc.addEventListener('mouseup', handleMouseUp, { once: true });
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
      handleMouseUp,
    ],
  );

  return React.useMemo(
    () => ({
      getTriggerProps,
      triggerRef: handleRef,
    }),
    [getTriggerProps, handleRef],
  );
}

export namespace useMenuTrigger {
  export interface Parameters {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * The ref to the root element.
     */
    rootRef?: React.Ref<HTMLElement>;
    /**
     * A callback to set the trigger element whenever it's mounted.
     */
    setTriggerElement: (element: HTMLElement | null) => void;
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    /**
     * A callback to set the open state of the Menu.
     */
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: MenuOpenChangeReason | undefined,
    ) => void;
    allowMouseUpTriggerRef: React.RefObject<boolean>;
    positionerRef: React.RefObject<HTMLElement | null>;
    menuParent: useMenuRoot.MenuParent;
    lastOpenChangeReason: MenuOpenChangeReason | null;
  }

  export interface ReturnValue {
    /**
     * Resolver for the trigger's props.
     * @param externalProps props for the root slot
     * @returns props that should be spread on the root slot
     */
    getTriggerProps: (externalProps?: HTMLProps) => HTMLProps;
    /**
     * The ref to the trigger element.
     */
    triggerRef: React.RefCallback<Element> | null;
  }
}
