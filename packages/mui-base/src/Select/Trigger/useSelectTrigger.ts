'use client';
import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../useButton/useButton';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { ownerDocument } from '../../utils/owner';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';

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

  const {
    open,
    setOpen,
    setTriggerElement,
    selectionRef,
    popupRef,
    label,
    value,
    getValidationProps,
    commitValidation,
  } = useSelectRootContext();

  const { labelId, setTouched } = useFieldRootContext();

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
        getValidationProps({ ...externalProps, children: label ?? externalProps?.children }),
        {
          'aria-labelledby': labelId,
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onBlur() {
            setTouched(true);
            commitValidation(value);
          },
          onMouseDown(event) {
            if (open) {
              return;
            }

            const doc = ownerDocument(event.currentTarget);

            function handleMouseUp(mouseEvent: MouseEvent) {
              if (!triggerRef.current) {
                return;
              }

              const mouseUpTarget = mouseEvent.target as Element | null;

              const triggerRect = triggerRef.current.getBoundingClientRect();

              const isInsideTrigger =
                mouseEvent.clientX >= triggerRect.left &&
                mouseEvent.clientX <= triggerRect.right &&
                mouseEvent.clientY >= triggerRect.top &&
                mouseEvent.clientY <= triggerRect.bottom;

              if (
                isInsideTrigger ||
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
    [
      getValidationProps,
      label,
      labelId,
      handleRef,
      getButtonProps,
      setTouched,
      commitValidation,
      value,
      open,
      popupRef,
      setOpen,
    ],
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
