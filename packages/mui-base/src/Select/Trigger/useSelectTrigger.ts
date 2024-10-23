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
    value,
    getValidationProps,
    commitValidation,
    setTouchModality,
    positionerElement,
  } = useSelectRootContext();

  const { labelId, setTouched } = useFieldRootContext();

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timeoutRef = React.useRef(-1);

  const mergedRef = useForkRef(externalRef, triggerRef);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: false,
    buttonRef: mergedRef,
  });

  const handleRef = useForkRef(buttonRef, setTriggerElement);

  React.useEffect(() => {
    if (open) {
      const timeoutId = window.setTimeout(() => {
        selectionRef.current.allowMouseUp = true;
      }, 400);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    selectionRef.current = {
      allowMouseUp: false,
      allowSelect: true,
    };

    clearTimeout(timeoutRef.current);

    return undefined;
  }, [open, selectionRef]);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps<'button'>(
        getValidationProps(externalProps),
        {
          'aria-labelledby': labelId,
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onBlur() {
            setTouched(true);
            commitValidation(value);
          },
          onPointerMove({ pointerType }) {
            setTouchModality(pointerType === 'touch');
          },
          onPointerDown({ pointerType }) {
            setTouchModality(pointerType === 'touch');
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
                contains(positionerElement, mouseUpTarget) ||
                contains(triggerRef.current, mouseUpTarget)
              ) {
                return;
              }

              setOpen(false, mouseEvent);
            }

            // Firefox can fire this upon mousedown
            timeoutRef.current = window.setTimeout(() => {
              doc.addEventListener('mouseup', handleMouseUp, { once: true });
            });
          },
        },
        getButtonProps(),
      );
    },
    [
      getValidationProps,
      labelId,
      handleRef,
      getButtonProps,
      setTouched,
      commitValidation,
      value,
      setTouchModality,
      open,
      positionerElement,
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
