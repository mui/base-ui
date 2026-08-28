'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { ownerDocument } from '@base-ui/utils/owner';
import { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import {
  useComboboxFloatingContext,
  useComboboxInputValueContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { triggerStateAttributesMapping } from '../utils/stateAttributesMapping';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { stopEvent, contains, getTarget } from '../../floating-ui-react/utils';
import { isMouseWithinBounds } from '../../utils/getPseudoElementBounds';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useClick, useTypeahead } from '../../floating-ui-react';
import type { Side } from '../../internals/useAnchorPositioning';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { resolveAriaLabelledBy } from '../../utils/resolveAriaLabelledBy';
import { getComboboxPopupId } from '../root/utils';
import { useListEmpty, usePopupSide } from '../utils/parts';

/**
 * A button that opens the popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
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
    id: idProp,
    style,
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
  const { labelId: fieldLabelId } = useLabelableContext();
  const store = useComboboxRootContext();

  const selectionMode = store.useState('selectionMode');
  const comboboxDisabled = store.useState('disabled');
  const readOnly = store.useState('readOnly');
  const required = store.useState('required');
  const positionerElement = store.useState('positionerElement');
  const listElement = store.useState('listElement');
  const storedPopupId = store.useState('popupId');
  const triggerProps = store.useState('triggerProps');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const rootId = store.useState('id');
  const comboboxLabelId = store.useState('labelId');
  const open = store.useState('open');
  const selectedValue = store.useState('selectedValue');
  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const hasSelectedValue = store.useState('hasSelectedValue');

  const floatingRootContext = useComboboxFloatingContext();
  const inputValue = useComboboxInputValueContext();

  const focusTimeout = useTimeout();

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;
  const listEmpty = useListEmpty();
  const popupSide = usePopupSide(store);

  useLabelableId({ id: inputInsidePopup ? idProp : undefined });
  const id = inputInsidePopup ? (idProp ?? rootId) : idProp;
  const ariaLabelledBy = resolveAriaLabelledBy(fieldLabelId, comboboxLabelId);

  let ariaControls: string | undefined;

  if (open && inputInsidePopup) {
    // Fall back to the default id while the popup registers its own (custom ids are stored once the
    // popup mounts), so `aria-controls` is set on the same commit `open` becomes `true`.
    ariaControls = storedPopupId ?? getComboboxPopupId(rootId);
  } else if (open) {
    ariaControls = listElement?.id;
  }

  const currentPointerTypeRef = React.useRef<PointerEvent['pointerType']>('');

  function trackPointerType(event: React.PointerEvent) {
    currentPointerTypeRef.current = event.pointerType;
  }

  const { reference: triggerTypeaheadProps } = useTypeahead(floatingRootContext, {
    // Typeahead on a closed trigger commits a value rather than moving a highlight, so it stays
    // gated on `readOnly`.
    enabled: !open && !readOnly && !comboboxDisabled && selectionMode === 'single',
    listRef: store.context.labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      const nextSelectedValue = store.context.valuesRef.current[index];
      if (nextSelectedValue !== undefined) {
        store.context.setSelectedValue(nextSelectedValue, createChangeEventDetails(REASONS.none));
      }
    },
  });

  const { reference: triggerClickProps } = useClick(floatingRootContext, {
    enabled: !comboboxDisabled,
    event: 'mousedown',
  });

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
  });

  const state: ComboboxTriggerState = {
    ...fieldState,
    readOnly,
    open,
    disabled,
    popupSide,
    listEmpty,
    placeholder: selectionMode === 'none' ? false : !hasSelectedValue,
  };

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
        id,
        tabIndex: inputInsidePopup ? 0 : -1,
        role: inputInsidePopup ? 'combobox' : undefined,
        'aria-expanded': open,
        'aria-haspopup': inputInsidePopup ? 'dialog' : 'listbox',
        'aria-controls': ariaControls,
        'aria-required': inputInsidePopup ? required || undefined : undefined,
        // Only valid alongside the `combobox` role; without it the trigger is a plain button, and
        // the `Combobox.Input` outside the popup already carries `aria-readonly`.
        'aria-readonly': inputInsidePopup ? readOnly || undefined : undefined,
        'aria-labelledby': ariaLabelledBy,
        onPointerDown: trackPointerType,
        onPointerEnter: trackPointerType,
        onFocus() {
          setFocused(true);

          if (disabled) {
            return;
          }

          focusTimeout.start(0, store.context.forceMount);
        },
        onBlur(event) {
          // If focus is moving into the popup, don't count it as a blur.
          if (contains(positionerElement, event.relatedTarget)) {
            return;
          }

          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            const valueToValidate = selectionMode === 'none' ? inputValue : selectedValue;
            validation.commit(valueToValidate);
          }
        },
        onMouseDown(event) {
          if (disabled) {
            return;
          }

          if (!inputInsidePopup) {
            floatingRootContext.set('domReferenceElement', event.currentTarget);
          }

          // Ensure items are registered for initial selection highlight.
          store.context.forceMount();

          if (currentPointerTypeRef.current !== 'touch') {
            store.context.inputRef.current?.focus();

            if (!inputInsidePopup) {
              event.preventDefault();
            }
          }

          if (open) {
            return;
          }

          const doc = ownerDocument(event.currentTarget);

          function handleMouseUp(mouseEvent: MouseEvent) {
            const currentTriggerElement = store.state.triggerElement;
            if (!currentTriggerElement) {
              return;
            }

            const mouseUpTarget = getTarget(mouseEvent) as Element | null;
            const positioner = store.state.positionerElement;
            const list = store.state.listElement;

            if (
              contains(currentTriggerElement, mouseUpTarget) ||
              contains(positioner, mouseUpTarget) ||
              contains(list, mouseUpTarget)
            ) {
              return;
            }

            if (isMouseWithinBounds(mouseEvent, currentTriggerElement)) {
              return;
            }

            store.context.setOpen(false, createChangeEventDetails(REASONS.cancelOpen, mouseEvent));
          }

          if (inputInsidePopup) {
            doc.addEventListener('mouseup', handleMouseUp, { once: true });
          }
        },
        onKeyDown(event) {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            stopEvent(event);
            store.context.setOpen(
              true,
              createChangeEventDetails(REASONS.listNavigation, event.nativeEvent),
            );
            store.context.inputRef.current?.focus();
          }
        },
      },
      validation.getValidationProps(disabled, elementProps),
      getButtonProps,
    ],
    stateAttributesMapping: triggerStateAttributesMapping,
  });

  return element;
});

export interface ComboboxTriggerState extends FieldRootState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the component should ignore user edits.
   */
  readOnly: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
  /**
   * Whether the combobox doesn't have a value.
   */
  placeholder: boolean;
}

export interface ComboboxTriggerProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ComboboxTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxTrigger {
  export type State = ComboboxTriggerState;
  export type Props = ComboboxTriggerProps;
}
