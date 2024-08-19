'use client';
import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../useButton/useButton';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { ownerDocument } from '../../utils/owner';

/**
 *
 * API:
 *
 * - [useSelectTrigger API](https://mui.com/base-ui/api/use-select-trigger/)
 */
export function useSelectTrigger(
  parameters: useSelectTrigger.Parameters,
): useSelectTrigger.ReturnValue {
  const { disabled = false, rootRef: externalRef } = parameters;

  const { open, setOpen, setTriggerElement, selectionRef, popupRef, backdropRef, label } =
    useSelectRootContext();

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timeoutRef = React.useRef(-1);

  const mergedRef = useForkRef(externalRef, triggerRef);

  const { getRootProps: getButtonProps, rootRef: buttonRootRef } = useButton({
    disabled,
    focusableWhenDisabled: false,
    rootRef: mergedRef,
  });

  const handleRef = useForkRef(buttonRootRef, setTriggerElement);

  React.useEffect(() => {
    if (open) {
      timeoutRef.current = window.setTimeout(() => {
        selectionRef.current.select = true;
      }, 300);

      return () => {
        window.clearTimeout(timeoutRef.current);
      };
    }

    selectionRef.current.mouseUp = true;
    selectionRef.current.select = false;
    return undefined;
  }, [open, selectionRef]);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps<'button'>(
        { ...externalProps, children: label ?? externalProps?.children },
        {
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onMouseDown(event) {
            if (open) {
              return;
            }

            const doc = ownerDocument(event.currentTarget);

            function handleMouseUp(mouseEvent: MouseEvent) {
              const mouseUpTarget = mouseEvent.target as Element | null;
              if (
                contains(backdropRef.current, mouseUpTarget) ||
                contains(popupRef.current, mouseUpTarget) ||
                contains(triggerRef.current, mouseUpTarget)
              ) {
                return;
              }

              setOpen(false, mouseEvent);
            }

            doc.addEventListener('mouseup', handleMouseUp, { once: true });
          },
        },
        getButtonProps(),
      );
    },
    [label, handleRef, getButtonProps, open, backdropRef, popupRef, setOpen],
  );

  return React.useMemo(
    () => ({
      getTriggerProps,
      rootRef: handleRef,
    }),
    [getTriggerProps, handleRef],
  );
}

export namespace useSelectTrigger {
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
  }

  export interface ReturnValue {
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}
