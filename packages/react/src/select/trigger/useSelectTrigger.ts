import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { useButton } from '../../use-button/useButton';
import type { HTMLProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useForkRef } from '../../utils/useForkRef';
import { useTimeout } from '../../utils/useTimeout';
import { useEventCallback } from '../../utils/useEventCallback';
import { useSelectRootContext } from '../root/SelectRootContext';
import { ownerDocument } from '../../utils/owner';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

const BOUNDARY_OFFSET = 2;

export function useSelectTrigger(
  parameters: useSelectTrigger.Parameters,
): useSelectTrigger.ReturnValue {
  const { elementProps, disabled = false, rootRef: externalRef, nativeButton } = parameters;

  const {
    store,
    setOpen,
    selectionRef,
    fieldControlValidation,
    readOnly,
    alignItemWithTriggerActiveRef,
  } = useSelectRootContext();

  const open = useSelector(store, selectors.open);
  const value = useSelector(store, selectors.value);
  const triggerProps = useSelector(store, selectors.triggerProps);
  const positionerElement = useSelector(store, selectors.positionerElement);

  const { labelId, setTouched, setFocused, validationMode } = useFieldRootContext();

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timeoutFocus = useTimeout();
  const timeoutMouseDown = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const setTriggerElement = useEventCallback((element) => {
    store.set('triggerElement', element);
  });

  const mergedRef = useForkRef<HTMLElement>(externalRef, triggerRef, buttonRef, setTriggerElement);

  const timeout1 = useTimeout();
  const timeout2 = useTimeout();

  React.useEffect(() => {
    if (open) {
      // mousedown -> move to unselected item -> mouseup should not select within 200ms.
      timeout2.start(200, () => {
        selectionRef.current.allowUnselectedMouseUp = true;

        // mousedown -> mouseup on selected item should not select within 400ms.
        timeout1.start(200, () => {
          selectionRef.current.allowSelectedMouseUp = true;
        });
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

    timeoutMouseDown.clear();

    return undefined;
  }, [open, selectionRef, timeoutMouseDown, timeout1, timeout2]);

  const props: HTMLProps = mergeProps<'button'>(
    triggerProps,
    {
      'aria-labelledby': labelId,
      'aria-readonly': readOnly || undefined,
      tabIndex: disabled ? -1 : 0,
      ref: mergedRef,
      onFocus(event) {
        setFocused(true);
        // The popup element shouldn't obscure the focused trigger.
        if (open && alignItemWithTriggerActiveRef.current) {
          setOpen(false, event.nativeEvent, 'focus-out');
        }

        // Saves a re-render on initial click: `forceMount === true` mounts
        // the items before `open === true`. We could sync those cycles better
        // without a timeout, but this is enough for now.
        //
        // XXX: might be causing `act()` warnings.
        timeoutFocus.start(0, () => {
          store.set('forceMount', true);
        });
      },
      onBlur() {
        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          fieldControlValidation.commitValidation(value);
        }
      },
      onPointerMove({ pointerType }) {
        store.set('touchModality', pointerType === 'touch');
      },
      onPointerDown({ pointerType }) {
        store.set('touchModality', pointerType === 'touch');
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
        timeoutMouseDown.start(0, () => {
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
    rootRef: mergedRef,
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
