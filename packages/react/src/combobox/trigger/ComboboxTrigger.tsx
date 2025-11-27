'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import {
  useComboboxFloatingContext,
  useComboboxInputValueContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { stopEvent, contains, getTarget } from '../../floating-ui-react/utils';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { fieldValidityMapping } from '../../field/utils/constants';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useClick, useTypeahead } from '../../floating-ui-react';

const BOUNDARY_OFFSET = 2;

const stateAttributesMapping: StateAttributesMapping<ComboboxTrigger.State> = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
};

/**
 * A button that opens the popup.
 * Renders a `<button>` element.
 */
export const ComboboxTrigger = React.forwardRef(function ComboboxTrigger(
  componentProps: ComboboxTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    nativeButton = true,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  const {
    state: fieldState,
    disabled: fieldDisabled,
    setTouched,
    setFocused,
    validationMode,
    validation,
  } = useFieldRootContext();
  const { labelId } = useLabelableContext();
  const store = useComboboxRootContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const listElement = useStore(store, selectors.listElement);
  const triggerProps = useStore(store, selectors.triggerProps);
  const triggerElement = useStore(store, selectors.triggerElement);
  const inputInsidePopup = useStore(store, selectors.inputInsidePopup);
  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);
  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedIndex = useStore(store, selectors.selectedIndex);

  const floatingRootContext = useComboboxFloatingContext();
  const inputValue = useComboboxInputValueContext();

  const focusTimeout = useTimeout();

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const currentPointerTypeRef = React.useRef<PointerEvent['pointerType']>('');

  function trackPointerType(event: React.PointerEvent) {
    currentPointerTypeRef.current = event.pointerType;
  }

  const domReference = floatingRootContext.select('domReferenceElement');

  // Update the floating root context to use the trigger element when it differs from the current reference.
  // This ensures useClick and useTypeahead attach handlers to the correct element.
  React.useEffect(() => {
    if (!inputInsidePopup) {
      return;
    }
    if (triggerElement && triggerElement !== domReference) {
      floatingRootContext.set('domReferenceElement', triggerElement);
    }
  }, [triggerElement, domReference, floatingRootContext, inputInsidePopup]);

  const { reference: triggerTypeaheadProps } = useTypeahead(floatingRootContext, {
    enabled: !open && !readOnly && !comboboxDisabled && selectionMode === 'single',
    listRef: store.state.labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      const nextSelectedValue = store.state.valuesRef.current[index];
      if (nextSelectedValue !== undefined) {
        store.state.setSelectedValue(nextSelectedValue, createChangeEventDetails('none'));
      }
    },
  });

  const { reference: triggerClickProps } = useClick(floatingRootContext, {
    enabled: !readOnly && !comboboxDisabled,
    event: 'mousedown',
  });

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
  });

  const state: ComboboxTrigger.State = React.useMemo(
    () => ({
      ...fieldState,
      open,
      disabled,
    }),
    [fieldState, open, disabled],
  );

  const setTriggerElement = useStableCallback((element) => {
    store.set('triggerElement', element);
  });

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef, setTriggerElement],
    state,
    props: [
      triggerProps,
      triggerClickProps,
      triggerTypeaheadProps,
      {
        tabIndex: inputInsidePopup ? 0 : -1,
        disabled,
        role: inputInsidePopup ? 'combobox' : undefined,
        'aria-expanded': open ? 'true' : 'false',
        'aria-haspopup': inputInsidePopup ? 'dialog' : 'listbox',
        'aria-controls': open ? listElement?.id : undefined,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        onPointerDown: trackPointerType,
        onPointerEnter: trackPointerType,
        onFocus() {
          setFocused(true);

          if (disabled || readOnly) {
            return;
          }

          focusTimeout.start(0, store.state.forceMount);
        },
        onBlur() {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
            validation.commit(valueToValidate);
          }
        },
        onMouseDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (!inputInsidePopup) {
            floatingRootContext.set('domReferenceElement', event.currentTarget);
          }

          // Ensure items are registered for initial selection highlight.
          store.state.forceMount();

          if (currentPointerTypeRef.current !== 'touch') {
            store.state.inputRef.current?.focus();

            if (!inputInsidePopup) {
              event.preventDefault();
            }
          }

          if (open) {
            return;
          }

          const doc = ownerDocument(event.currentTarget);

          function handleMouseUp(mouseEvent: MouseEvent) {
            if (!triggerElement) {
              return;
            }

            const mouseUpTarget = getTarget(mouseEvent) as Element | null;
            const positioner = store.state.positionerElement;
            const list = store.state.listElement;

            if (
              contains(triggerElement, mouseUpTarget) ||
              contains(positioner, mouseUpTarget) ||
              contains(list, mouseUpTarget) ||
              mouseUpTarget === triggerElement
            ) {
              return;
            }

            const bounds = getPseudoElementBounds(triggerElement);

            const withinHorizontal =
              mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET &&
              mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET;
            const withinVertical =
              mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET &&
              mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET;

            if (withinHorizontal && withinVertical) {
              return;
            }

            store.state.setOpen(false, createChangeEventDetails('cancel-open', mouseEvent));
          }

          if (inputInsidePopup) {
            doc.addEventListener('mouseup', handleMouseUp, { once: true });
          }
        },
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            stopEvent(event);
            store.state.setOpen(
              true,
              createChangeEventDetails(REASONS.listNavigation, event.nativeEvent),
            );
            store.state.inputRef.current?.focus();
          }
        },
      },
      validation ? validation.getValidationProps(elementProps) : elementProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });

  return element;
});

export interface ComboboxTriggerState extends FieldRoot.State {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface ComboboxTriggerProps
  extends NativeButtonProps,
    BaseUIComponentProps<'button', ComboboxTrigger.State> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
}

export namespace ComboboxTrigger {
  export type State = ComboboxTriggerState;
  export type Props = ComboboxTriggerProps;
}
