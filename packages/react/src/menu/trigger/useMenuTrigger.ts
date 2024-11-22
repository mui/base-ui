'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useButton } from '../../use-button/useButton';
import { useForkRef } from '../../utils/useForkRef';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';

export function useMenuTrigger(parameters: useMenuTrigger.Parameters): useMenuTrigger.ReturnValue {
  const {
    disabled = false,
    rootRef: externalRef,
    open,
    setOpen,
    setTriggerElement,
    setClickAndDragEnabled,
  } = parameters;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useForkRef(externalRef, triggerRef);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: mergedRef,
  });

  const handleRef = useForkRef(buttonRef, setTriggerElement);
  const ignoreNextClick = React.useRef(false);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          'aria-haspopup': 'menu' as const,
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onMouseDown: (event: React.MouseEvent) => {
            if (open) {
              return;
            }

            // prevents closing the menu right after it was opened
            ignoreNextClick.current = true;
            event.preventDefault();

            setClickAndDragEnabled(true);

            const mousedownTarget = event.target as Element;

            function handleDocumentMouseUp(mouseUpEvent: MouseEvent) {
              const mouseupTarget = mouseUpEvent.target as HTMLElement;
              if (mouseupTarget?.dataset?.handleMouseup === 'true') {
                mouseupTarget.click();
              } else if (
                mouseupTarget !== triggerRef.current &&
                !triggerRef.current?.contains(mouseupTarget)
              ) {
                setOpen(false, mouseUpEvent);
              }

              setClickAndDragEnabled(false);
              ownerDocument(mousedownTarget).removeEventListener('mouseup', handleDocumentMouseUp);
            }

            ownerDocument(mousedownTarget).addEventListener('mouseup', handleDocumentMouseUp);
          },
          onClick: () => {
            if (ignoreNextClick.current) {
              ignoreNextClick.current = false;
            }
          },
        },
        getButtonProps(),
      );
    },
    [getButtonProps, handleRef, open, setOpen, setClickAndDragEnabled],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      rootRef: handleRef,
    }),
    [getRootProps, handleRef],
  );
}

export namespace useMenuTrigger {
  export interface Parameters {
    /**
     * If `true`, the component is disabled.
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
     * If `true`, the Menu is open.
     */
    open: boolean;
    /**
     * A callback to set the open state of the Menu.
     */
    setOpen: (open: boolean, event: Event | undefined) => void;
    /**
     * The FloatingEvents instance of the menu's root.
     */
    menuEvents: FloatingEvents;
    /**
     * A callback to enable/disable click and drag functionality.
     */
    setClickAndDragEnabled: (enabled: boolean) => void;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps props for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * The ref to the root element.
     */
    rootRef: React.RefCallback<Element> | null;
  }
}
