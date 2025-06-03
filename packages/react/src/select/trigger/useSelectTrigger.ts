import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../use-button/useButton';
import type { HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useForkRef } from '../../utils/useForkRef';
import { useTimeout } from '../../utils/useTimeout';
import { useSelectRootContext } from '../root/SelectRootContext';
import { ownerDocument } from '../../utils/owner';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';

const BOUNDARY_OFFSET = 2;

export function useSelectTrigger(
  parameters: useSelectTrigger.Parameters,
): useSelectTrigger.ReturnValue {
  const { elementProps, disabled = false, rootRef: externalRef, nativeButton } = parameters;

  const {
    open,
    setOpen,
    setTriggerElement,
    selectionRef,
    value,
    fieldControlValidation,
    setTouchModality,
    positionerElement,
    readOnly,
    alignItemWithTriggerActiveRef,
    triggerProps,
    setTypeaheadReady,
  } = useSelectRootContext();

  const { labelId, setTouched, setFocused, validationMode } = useFieldRootContext();

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timeout = useTimeout();

  const mergedRef = useForkRef(externalRef, triggerRef);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: mergedRef,
    native: nativeButton,
  });

  const handleRef = useForkRef<HTMLElement>(buttonRef, setTriggerElement);

  const timeout1 = useTimeout();
  const timeout2 = useTimeout();

  React.useEffect(() => {
    if (open) {
      // mousedown -> mouseup on selected item should not select within 400ms.
      timeout1.start(400, () => {
        selectionRef.current.allowSelectedMouseUp = true;
      });
      // mousedown -> move to unselected item -> mouseup should not select within 200ms.
      timeout2.start(200, () => {
        selectionRef.current.allowUnselectedMouseUp = true;
      });

      return () => {
        timeout1.clear();
        timeout2.clear();
      };
    }

    selectionRef.current = {
      allowSelectedMouseUp: false,
      allowUnselectedMouseUp: false,
      allowSelect: true,
    };

    timeout.clear();

    return undefined;
  }, [open, selectionRef, timeout, timeout1, timeout2]);

  const props: HTMLProps = mergeProps<'button'>(
    triggerProps,
    {
      'aria-labelledby': labelId,
      'aria-readonly': readOnly || undefined,
      tabIndex: disabled ? -1 : 0,
      ref: handleRef,
      onFocus(event) {
        setTypeaheadReady(true);
        setFocused(true);
        // The popup element shouldn't obscure the focused trigger.
        if (open && alignItemWithTriggerActiveRef.current) {
          setOpen(false, event.nativeEvent, 'focus-out');
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

          setOpen(false, mouseEvent, 'cancel-open');
        }

        // Firefox can fire this upon mousedown
        timeout.start(0, () => {
          doc.addEventListener('mouseup', handleMouseUp, { once: true });
        });
      },
    },
    fieldControlValidation.getValidationProps,
    elementProps,
    getButtonProps,
  );

  // ensure nested useButton does not overwrite the combobox role:
  // <Toolbar.Button render={<Select.Trigger />} />
  props.role = 'combobox';

  return {
    props,
    rootRef: handleRef,
  };
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
    elementProps: HTMLProps;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton: boolean;
  }

  export interface ReturnValue {
    props: HTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}
