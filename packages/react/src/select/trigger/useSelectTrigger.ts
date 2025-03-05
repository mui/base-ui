import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../use-button/useButton';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../root/SelectRootContext';
import { ownerDocument } from '../../utils/owner';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';

export function useSelectTrigger(
  parameters: useSelectTrigger.Parameters,
): useSelectTrigger.ReturnValue {
  const BOUNDARY_OFFSET = 2;

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

  const { labelId, setTouched, setFocused, validationMode } = useFieldRootContext();

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
        {
          'aria-labelledby': labelId,
          'aria-readonly': readOnly || undefined,
          tabIndex: disabled ? -1 : 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onFocus() {
            setFocused(true);
            // The popup element shouldn't obscure the focused trigger.
            if (open && alignItemToTrigger) {
              setOpen(false);
            }
          },
          onBlur() {
            setTouched(true);
            setFocused(false);

            if (validationMode === 'onBlur') {
              fieldControlValidation.commitValidation(value);
            }
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

              // Early return if clicked on trigger element or its children
              if (
                contains(triggerRef.current, mouseUpTarget) ||
                contains(positionerElement, mouseUpTarget) ||
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

            // Firefox can fire this upon mousedown
            timeoutRef.current = window.setTimeout(() => {
              doc.addEventListener('mouseup', handleMouseUp, { once: true });
            });
          },
        },
        fieldControlValidation.getValidationProps(externalProps),
        getButtonProps,
        // ensure nested useButton does not overwrite the combobox role:
        // <Toolbar.Button render={<Select.Trigger />} />
        { role: 'combobox' },
      );
    },
    [
      getButtonProps,
      fieldControlValidation,
      labelId,
      readOnly,
      disabled,
      handleRef,
      setFocused,
      open,
      alignItemToTrigger,
      setOpen,
      setTouched,
      setTouchModality,
      validationMode,
      value,
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
