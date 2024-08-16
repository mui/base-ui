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

  const { selectedValue, open, setOpen, setTriggerElement, selectionRef, popupRef } =
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
        { ...externalProps, children: selectedValue ?? externalProps?.children },
        {
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onMouseDown(event) {
            if (open) {
              return;
            }

            const doc = ownerDocument(event.currentTarget);

            function handleMouseUp(mouseEvent: MouseEvent) {
              const target = mouseEvent.target as Element | null;
              if (contains(popupRef.current, target) || contains(triggerRef.current, target)) {
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
    [selectedValue, handleRef, getButtonProps, open, popupRef, setOpen],
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
