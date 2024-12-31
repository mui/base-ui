import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../use-button/useButton';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../root/SelectRootContext';
import { ownerDocument } from '../../utils/owner';
import { useFieldRootContext } from '../../field/root/FieldRootContext';

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
    fieldControlValidation,
    setTouchModality,
    positionerElement,
    alignItemToTrigger,
    readOnly,
  } = useSelectRootContext();

  const { labelId, setTouched } = useFieldRootContext();

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timeoutRef = React.useRef(-1);

  const mergedRef = useForkRef(externalRef, triggerRef);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: mergedRef,
  });

  const handleRef = useForkRef<HTMLElement>(buttonRef, setTriggerElement);

  React.useEffect(() => {
    if (open) {
      // mousedown -> mouseup on selected item should not select within 400ms.
      const timeoutId1 = window.setTimeout(() => {
        selectionRef.current.allowSelectedMouseUp = true;
      }, 400);
      // mousedown -> move to unselected item -> mouseup should not select within 200ms.
      const timeoutId2 = window.setTimeout(() => {
        selectionRef.current.allowUnselectedMouseUp = true;
      }, 200);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
      };
    }

    selectionRef.current = {
      allowSelectedMouseUp: false,
      allowUnselectedMouseUp: false,
      allowSelect: true,
    };

    clearTimeout(timeoutRef.current);

    return undefined;
  }, [open, selectionRef]);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps<'button'>(
        fieldControlValidation.getValidationProps(externalProps),
        {
          'aria-labelledby': labelId,
          'aria-readonly': readOnly || undefined,
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onFocus() {
            // The popup element shouldn't obscure the focused trigger.
            if (open && alignItemToTrigger) {
              setOpen(false);
            }
          },
          onBlur() {
            setTouched(true);
            fieldControlValidation.commitValidation(value);
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

            function getPseudoElementPadding(triggerRefElement: HTMLElement) {
              const beforeStyles = window.getComputedStyle(triggerRefElement, '::before');
              const afterStyles = window.getComputedStyle(triggerRefElement, '::after');

              const hasPseudoElements =
                beforeStyles.content !== 'none' || afterStyles.content !== 'none';

              const padding = hasPseudoElements
                ? Math.max(
                    parseInt(beforeStyles.width || '0', 10),
                    parseInt(afterStyles.width || '0', 10),
                    parseInt(beforeStyles.height || '0', 10),
                    parseInt(afterStyles.height || '0', 10),
                  ) / 2
                : 0;

              return padding;
            }

            function handleMouseUp(mouseEvent: MouseEvent) {
              if (!triggerRef.current) {
                return;
              }

              const mouseUpTarget = mouseEvent.target as Element | null;

              if (
                contains(triggerRef.current, mouseUpTarget) ||
                contains(positionerElement, mouseUpTarget) ||
                mouseUpTarget === triggerRef.current
              ) {
                return;
              }

              const padding = getPseudoElementPadding(triggerRef.current);
              const triggerRect = triggerRef.current.getBoundingClientRect();

              if (
                mouseEvent.clientX >= triggerRect.left - padding &&
                mouseEvent.clientX <= triggerRect.right + padding &&
                mouseEvent.clientY >= triggerRect.top - padding &&
                mouseEvent.clientY <= triggerRect.bottom + padding
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
      fieldControlValidation,
      labelId,
      readOnly,
      handleRef,
      getButtonProps,
      open,
      alignItemToTrigger,
      setOpen,
      setTouched,
      value,
      setTouchModality,
      positionerElement,
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
     * Whether the component should ignore user interaction.
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
