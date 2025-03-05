'use client';
import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../use-button/useButton';
import { useForkRef } from '../../utils/useForkRef';
import { GenericHTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { ownerDocument } from '../../utils/owner';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';

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
  } = parameters;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useForkRef(externalRef, triggerRef);
  const allowMouseUpTriggerTimeoutRef = React.useRef(-1);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: mergedRef,
  });

  const handleRef = useForkRef(buttonRef, setTriggerElement);

  React.useEffect(() => {
    if (!open) {
      allowMouseUpTriggerRef.current = false;
    }
  }, [allowMouseUpTriggerRef, open]);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeProps(
        {
          'aria-haspopup': 'menu' as const,
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onMouseDown: (event: React.MouseEvent) => {
            if (open) {
              return;
            }

            // mousedown -> mouseup on menu item should not trigger it within 200ms.
            allowMouseUpTriggerTimeoutRef.current = window.setTimeout(() => {
              allowMouseUpTriggerRef.current = true;
            }, 200);

            const doc = ownerDocument(event.currentTarget);

            function handleMouseUp(mouseEvent: MouseEvent) {
              if (!triggerRef.current) {
                return;
              }

              if (allowMouseUpTriggerTimeoutRef.current !== -1) {
                clearTimeout(allowMouseUpTriggerTimeoutRef.current);
                allowMouseUpTriggerTimeoutRef.current = -1;
              }
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

              setOpen(false, mouseEvent);
            }

            doc.addEventListener('mouseup', handleMouseUp, { once: true });
          },
        },
        externalProps,
        getButtonProps,
      );
    },
    [getButtonProps, handleRef, open, setOpen, positionerRef, allowMouseUpTriggerRef],
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
    setOpen: (open: boolean, event: Event | undefined) => void;
    allowMouseUpTriggerRef: React.RefObject<boolean>;
    positionerRef: React.RefObject<HTMLElement | null>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the trigger's props.
     * @param externalProps props for the root slot
     * @returns props that should be spread on the root slot
     */
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * The ref to the trigger element.
     */
    triggerRef: React.RefCallback<Element> | null;
  }
}
