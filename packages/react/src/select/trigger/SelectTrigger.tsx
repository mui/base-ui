'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useStore } from '@base-ui-components/utils/store';
import { useSelectRootContext } from '../root/SelectRootContext';
import { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../utils/types';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { fieldValidityMapping } from '../../field/utils/constants';
import { useRenderElement } from '../../utils/useRenderElement';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { selectors } from '../store';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { contains } from '../../floating-ui-react/utils';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button';
import type { FieldRoot } from '../../field/root/FieldRoot';

const BOUNDARY_OFFSET = 2;

const customStyleHookMapping: CustomStyleHookMapping<SelectTrigger.State> = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
  value: () => null,
};

/**
 * A button that opens the select menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectTrigger = React.forwardRef(function SelectTrigger(
  componentProps: SelectTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = false,
    ...elementProps
  } = componentProps;

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const {
    store,
    setOpen,
    selectionRef,
    fieldControlValidation,
    readOnly,
    alignItemWithTriggerActiveRef,
    disabled: selectDisabled,
    keyboardActiveRef,
  } = useSelectRootContext();

  const disabled = fieldDisabled || selectDisabled || disabledProp;

  const open = useStore(store, selectors.open);
  const value = useStore(store, selectors.value);
  const triggerProps = useStore(store, selectors.triggerProps);
  const positionerElement = useStore(store, selectors.positionerElement);

  const positionerRef = useLatestRef(positionerElement);

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

  const mergedRef = useMergedRefs<HTMLElement>(
    forwardedRef,
    triggerRef,
    buttonRef,
    setTriggerElement,
  );

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

  const props: HTMLProps = mergeProps<'div'>(
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
        keyboardActiveRef.current = false;
        store.set('touchModality', pointerType === 'touch');
      },
      onPointerDown({ pointerType }) {
        store.set('touchModality', pointerType === 'touch');
      },
      onKeyDown(event) {
        keyboardActiveRef.current = true;

        if (event.key === 'ArrowDown') {
          setOpen(true, event.nativeEvent, 'list-navigation');
        }
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

  const state: SelectTrigger.State = React.useMemo(
    () => ({
      ...fieldState,
      open,
      disabled,
      value,
      readOnly,
    }),
    [fieldState, open, disabled, readOnly, value],
  );

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, triggerRef],
    state,
    customStyleHookMapping,
    props,
  });
});

export namespace SelectTrigger {
  export interface Props extends NonNativeButtonProps, BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }

  export interface State extends FieldRoot.State {
    /**
     * Whether the select menu is currently open.
     */
    open: boolean;
    /**
     * Whether the select menu is readonly.
     */
    readOnly: boolean;
    /**
     * The value of the currently selected item.
     */
    value: any;
  }
}
