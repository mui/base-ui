'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useSelectRootContext } from '../root/SelectRootContext';
import { BaseUIComponentProps, HTMLProps, NativeButtonProps } from '../../internals/types';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { fieldValidityMapping } from '../../internals/field-constants/constants';
import { useRenderElement } from '../../internals/useRenderElement';
import { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { isMouseWithinBounds } from '../../utils/getPseudoElementBounds';
import { contains, getFloatingFocusElement } from '../../floating-ui-react/utils';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../internals/use-button';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { resolveAriaLabelledBy } from '../../utils/resolveAriaLabelledBy';
import type { Side } from '../../internals/useAnchorPositioning';

const SELECTED_DELAY = 400;

const stateAttributesMapping: StateAttributesMapping<SelectTriggerState> = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
  popupSide: (side: Side | null) => (side ? { 'data-popup-side': side } : null),
  value: () => null,
};

/**
 * A button that opens the select popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectTrigger = React.forwardRef(function SelectTrigger(
  componentProps: SelectTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    id: idProp,
    disabled: disabledProp = false,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  const {
    setTouched,
    setFocused,
    validationMode,
    validation,
    state: fieldState,
    disabled: fieldDisabled,
  } = useFieldRootContext();
  const { labelId: fieldLabelId } = useLabelableContext();
  const store = useSelectRootContext();
  const readOnly = store.useState('readOnly');
  const required = store.useState('required');
  const selectDisabled = store.useState('disabled');
  const disabled = fieldDisabled || selectDisabled || disabledProp;

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const value = store.useState('value');
  const triggerProps = store.useState('triggerProps');
  const positionerElement = store.useState('positionerElement');
  const listElement = store.useState('listElement');
  const popupSideValue = store.useState('popupSide');
  const rootId = store.useState('id');
  const selectLabelId = store.useState('labelId');
  const hasSelectedValue = store.useState('hasSelectedValue');
  const popupSide = mounted && positionerElement ? popupSideValue : null;

  const id = idProp ?? rootId;
  const ariaLabelledBy = resolveAriaLabelledBy(fieldLabelId, selectLabelId);

  useLabelableId({ id: idProp });

  const positionerRef = useValueAsRef(positionerElement);

  const triggerRef = React.useRef<HTMLElement | null>(null);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const setTriggerElement = store.useStateSetter('triggerElement');

  const timeoutFocus = useTimeout();
  const timeoutMouseDown = useTimeout();
  const selectedDelayTimeout = useTimeout();

  React.useEffect(() => {
    if (open) {
      // A mousedown on the trigger can open the popup under the cursor. Keep mouseup selection
      // disabled briefly so releasing over either the selected item or a neighboring item doesn't
      // commit an accidental selection. SelectItem can still opt into unselected mouseup sooner
      // after a real drag over the item.
      selectedDelayTimeout.start(SELECTED_DELAY, () => {
        store.context.selectionRef.current.allowUnselectedMouseUp = true;
        store.context.selectionRef.current.allowSelectedMouseUp = true;
      });

      return () => {
        selectedDelayTimeout.clear();
      };
    }

    store.context.selectionRef.current = {
      allowSelectedMouseUp: false,
      allowUnselectedMouseUp: false,
      dragY: 0,
    };

    timeoutMouseDown.clear();

    return undefined;
  }, [open, store, timeoutMouseDown, selectedDelayTimeout]);

  const mergedProps: HTMLProps = mergeProps<'button'>(
    triggerProps,
    {
      id,
      role: 'combobox',
      'aria-expanded': open,
      'aria-haspopup': 'listbox',
      'aria-controls': open
        ? (listElement?.id ?? getFloatingFocusElement(positionerElement)?.id)
        : undefined,
      'aria-labelledby': ariaLabelledBy,
      'aria-readonly': readOnly || undefined,
      'aria-required': required || undefined,
      tabIndex: disabled ? -1 : 0,
      onFocus(event) {
        setFocused(true);

        // The popup element shouldn't obscure the focused trigger.
        if (open && store.context.alignItemWithTriggerActiveRef.current) {
          store.context.setOpen(false, createChangeEventDetails(REASONS.none, event.nativeEvent));
        }

        // Saves a re-render on initial click: `forceMount === true` mounts
        // the items before `open === true`. We could sync those cycles better
        // without a timeout, but this is enough for now.
        timeoutFocus.start(0, () => {
          store.set('forceMount', true);
        });
      },
      onBlur(event) {
        // If focus is moving into the popup, don't count it as a blur.
        if (contains(positionerElement, event.relatedTarget)) {
          return;
        }

        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          validation.commit(value);
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

          // Don't treat the release as an outside press when it lands on the trigger or inside
          // the popup positioner (or their children).
          if (
            contains(triggerRef.current, mouseUpTarget) ||
            contains(positionerRef.current, mouseUpTarget)
          ) {
            return;
          }

          if (isMouseWithinBounds(mouseEvent, triggerRef.current)) {
            return;
          }

          store.context.setOpen(false, createChangeEventDetails(REASONS.cancelOpen, mouseEvent));
        }

        // Firefox can fire this upon mousedown
        timeoutMouseDown.start(0, () => {
          doc.addEventListener('mouseup', handleMouseUp, { once: true });
        });
      },
    },
    elementProps,
    getButtonProps,
  );
  const props = validation.getValidationProps(disabled, mergedProps);

  // ensure nested useButton does not overwrite the combobox role:
  // <Toolbar.Button render={<Select.Trigger />} />
  props.role = 'combobox';

  const state: SelectTriggerState = {
    ...fieldState,
    open,
    disabled,
    value,
    readOnly,
    popupSide,
    placeholder: !hasSelectedValue,
  };

  return useRenderElement('button', componentProps, {
    ref: [forwardedRef, triggerRef, buttonRef, setTriggerElement],
    state,
    stateAttributesMapping,
    props,
  });
});

export interface SelectTriggerState extends FieldRootState {
  /**
   * Whether the select popup is currently open.
   */
  open: boolean;
  /**
   * Whether the select popup is readonly.
   */
  readOnly: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * The value of the currently selected item.
   */
  value: any;
  /**
   * Whether the select doesn't have a value.
   */
  placeholder: boolean;
}

export interface SelectTriggerProps
  extends NativeButtonProps, BaseUIComponentProps<'button', SelectTriggerState> {
  children?: React.ReactNode;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled?: boolean | undefined;
}

export namespace SelectTrigger {
  export type State = SelectTriggerState;
  export type Props = SelectTriggerProps;
}
