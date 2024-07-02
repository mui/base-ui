'use client';
import * as React from 'react';
import {
  unstable_useForkRef as useForkRef,
  unstable_useId as useId,
  unstable_useEnhancedEffect as useEnhancedEffect,
  visuallyHidden as visuallyHiddenStyle,
} from '@mui/utils';
import { useButton } from '../../useButton';
import {
  ButtonClickAction,
  SelectAction,
  SelectActionTypes,
  SelectInternalState,
  SelectValue,
  UseSelectParameters,
  UseSelectReturnValue,
} from './useSelect.types';
import { ListActionTypes, useList } from '../../useList';
import { EventHandlers, GenericHTMLProps } from '../../utils/types';
import { useCompoundParent } from '../../useCompound';
import { extractEventHandlers } from '../../utils/extractEventHandlers';
import { SelectOption } from '../useOption/useOption.types';
import { selectReducer } from './selectReducer';
import { combineHooksSlotProps } from '../utils/combineHooksSlotProps';
import { MuiCancellableEvent } from '../../utils/MuiCancellableEvent';
import { useControllableReducer } from '../../utils/useControllableReducer';
import { mergeReactProps } from '../../utils/mergeReactProps';

function defaultFormValueProvider<OptionValue>(
  selectedOption: SelectOption<OptionValue> | SelectOption<OptionValue>[] | null,
) {
  if (Array.isArray(selectedOption)) {
    if (selectedOption.length === 0) {
      return '';
    }

    return JSON.stringify(selectedOption.map((o) => o.value));
  }

  if (selectedOption?.value == null) {
    return '';
  }

  if (typeof selectedOption.value === 'string' || typeof selectedOption.value === 'number') {
    return selectedOption.value;
  }

  return JSON.stringify(selectedOption.value);
}

/**
 *
 * Demos:
 *
 * - [Select](https://mui.com/base-ui/react-select/#hooks)
 *
 * API:
 *
 * - [useSelect API](https://mui.com/base-ui/react-select/hooks-api/#use-select)
 */
function useSelect<OptionValue, Multiple extends boolean = false>(
  props: UseSelectParameters<OptionValue, Multiple>,
): UseSelectReturnValue<OptionValue> {
  const {
    buttonRef: buttonRefProp,
    defaultOpen = false,
    defaultValue: defaultValueProp,
    disabled = false,
    listboxId: listboxIdProp,
    listboxRef: listboxRefProp,
    multiple = false as Multiple,
    name,
    required,
    onChange,
    onHighlightChange,
    onOpenChange,
    open: openProp,
    options: optionsParam,
    getSerializedValue = defaultFormValueProvider,
    value: valueProp,
  } = props;

  const buttonRef = React.useRef<HTMLElement>(null);
  const handleButtonRef = useForkRef(buttonRefProp, buttonRef);

  const listboxRef = React.useRef<HTMLElement>(null);
  const listboxId = useId(listboxIdProp);

  let defaultValue: OptionValue[] | undefined;
  if (valueProp === undefined && defaultValueProp === undefined) {
    defaultValue = [];
  } else if (defaultValueProp !== undefined) {
    if (multiple) {
      defaultValue = defaultValueProp as OptionValue[];
    } else {
      defaultValue = defaultValueProp == null ? [] : [defaultValueProp as OptionValue];
    }
  }

  const value = React.useMemo(() => {
    if (valueProp !== undefined) {
      if (multiple) {
        return valueProp as OptionValue[];
      }

      return valueProp == null ? [] : [valueProp as OptionValue];
    }

    return undefined;
  }, [valueProp, multiple]);

  const { subitems, context: compoundParentContext } = useCompoundParent<
    any,
    SelectOption<OptionValue>
  >();

  const options = React.useMemo(() => {
    if (optionsParam != null) {
      return new Map(
        optionsParam.map((option, index) => [
          option.value,
          {
            value: option.value,
            label: option.label,
            disabled: option.disabled,
            ref: React.createRef<HTMLElement>(),
            id: `${listboxId}_${index}`,
          },
        ]),
      );
    }

    return subitems;
  }, [optionsParam, subitems, listboxId]);

  const handleListboxRef = useForkRef(listboxRefProp, listboxRef);

  const { getRootProps: getButtonRootProps, rootRef: mergedButtonRef } = useButton({
    disabled,
    rootRef: handleButtonRef,
  });

  const controlledProps = React.useMemo(
    () => ({
      selectedValues: value,
      open: openProp,
    }),
    [value, openProp],
  );

  type ChangeEvent = React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;

  const handleStateChange = React.useCallback(
    (event: React.SyntheticEvent | Event | null, field: string, fieldValue: any) => {
      switch (field) {
        case 'open':
          onOpenChange?.(fieldValue as boolean);
          if (fieldValue === false && event?.type !== 'blur') {
            buttonRef.current?.focus();
          }
          break;

        case 'highlightedValue':
          onHighlightChange?.(event as ChangeEvent, fieldValue as OptionValue | null);
          break;

        case 'selectedValues':
          if (multiple) {
            onChange?.(event as ChangeEvent, fieldValue as SelectValue<OptionValue, Multiple>);
          } else {
            onChange?.(
              event as ChangeEvent,
              (fieldValue[0] ?? null) as SelectValue<OptionValue, Multiple>,
            );
          }
          break;

        default:
      }
    },
    [onOpenChange, multiple, onHighlightChange, onChange],
  );

  const initialState: SelectInternalState<OptionValue> = React.useMemo(
    () => ({
      highlightedValue: null,
      selectedValues: defaultValue ?? [],
      open: defaultOpen,
      items: subitems,
      settings: {
        selectionMode: multiple ? 'multiple' : 'single',
        direction: 'ltr',
        orientation: 'vertical',
        pageSize: 1,
        focusManagement: 'DOM',
        disableListWrap: false,
        disabledItemsFocusable: false,
      },
    }),
    [defaultOpen, defaultValue, subitems, multiple],
  );

  const [state, dispatch] = useControllableReducer<
    SelectInternalState<OptionValue>,
    SelectAction<OptionValue>
  >({
    controlledProps,
    initialState,
    onStateChange: handleStateChange,
    reducer: selectReducer,
    componentName: 'MenuRoot',
  });

  const { getRootProps: getListboxRootProps, rootRef: mergedListRootRef } = useList({
    dispatch,
    items: subitems,
    rootRef: handleListboxRef,
    focusManagement: state.settings.focusManagement,
    highlightedValue: state.highlightedValue,
    selectedValues: state.selectedValues,
    orientation: state.settings.orientation,
    direction: state.settings.direction,
    isNested: false,
  });

  // store the initial open state to prevent focus stealing
  // (the first option gets focused only when the select is opened by the user)
  const isInitiallyOpen = React.useRef(state.open);

  useEnhancedEffect(() => {
    if (state.highlightedValue == null) {
      return;
    }

    const highlightedOption = state.items.get(state.highlightedValue);
    if (state.open && highlightedOption != null) {
      const optionRef = highlightedOption.ref;

      if (!listboxRef.current || !optionRef?.current) {
        return;
      }

      if (!isInitiallyOpen.current) {
        optionRef.current.focus({ preventScroll: true });
      }

      const listboxClientRect = listboxRef.current.getBoundingClientRect();
      const optionClientRect = optionRef.current.getBoundingClientRect();

      if (optionClientRect.top < listboxClientRect.top) {
        listboxRef.current.scrollTop -= listboxClientRect.top - optionClientRect.top;
      } else if (optionClientRect.bottom > listboxClientRect.bottom) {
        listboxRef.current.scrollTop += optionClientRect.bottom - listboxClientRect.bottom;
      }
    }
  }, [state.open, state.highlightedValue, state.items]);

  const getSelectTriggerProps = <OtherHandlers extends EventHandlers>(
    otherHandlers: OtherHandlers = {} as OtherHandlers,
  ) => {
    return mergeReactProps(otherHandlers, {
      onClick: (event: React.MouseEvent) => {
        const action: ButtonClickAction = {
          type: SelectActionTypes.buttonClick,
          event,
        };

        dispatch(action);
      },
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          dispatch({
            type: ListActionTypes.keyDown,
            key: event.key,
            event,
          });
        }
      },

      role: 'combobox' as const,
      'aria-expanded': state.open,
      'aria-controls': listboxId,
    });
  };

  const getButtonProps = (externalProps?: GenericHTMLProps): GenericHTMLProps => {
    const externalEventHandlers = extractEventHandlers(externalProps);
    const combinedProps = combineHooksSlotProps(getSelectTriggerProps, getButtonRootProps);

    return {
      ...externalProps,
      ...combinedProps(externalEventHandlers),
    };
  };

  const getListboxProps = (externalProps?: GenericHTMLProps): GenericHTMLProps => {
    return mergeReactProps(
      externalProps,
      getListboxRootProps({
        id: listboxId,
        role: 'listbox' as const,
        'aria-multiselectable': multiple ? 'true' : undefined,
        onBlur: (event: React.FocusEvent) => {
          if (
            listboxRef.current?.contains(event.relatedTarget as HTMLElement) ||
            event.relatedTarget === buttonRef.current
          ) {
            (event as any).defaultMuiPrevented = true;
          }
        },
      }),
    );
  };

  let selectedOptionsMetadata: SelectValue<SelectOption<OptionValue>, Multiple>;
  if (multiple) {
    selectedOptionsMetadata = state.selectedValues
      .map((v) => state.items.get(v))
      .filter((o) => o !== undefined) as SelectValue<SelectOption<OptionValue>, Multiple>;
  } else {
    selectedOptionsMetadata = (
      state.selectedValues.length > 0 ? state.items.get(state.selectedValues[0]) : null
    ) as SelectValue<SelectOption<OptionValue>, Multiple>;
  }

  const createHandleHiddenInputChange =
    (externalEventHandlers?: EventHandlers) =>
    (event: React.ChangeEvent<HTMLInputElement> & MuiCancellableEvent) => {
      externalEventHandlers?.onChange?.(event);

      if (event.defaultMuiPrevented) {
        return;
      }

      const option = options.get(event.target.value as OptionValue);

      // support autofill
      if (event.target.value === '') {
        dispatch({
          type: ListActionTypes.clearSelection,
        });
      } else if (option !== undefined) {
        dispatch({
          type: SelectActionTypes.browserAutoFill,
          item: option.value,
          event,
        });
      }
    };

  const getHiddenInputProps = (
    externalProps?: React.InputHTMLAttributes<HTMLInputElement>,
  ): React.InputHTMLAttributes<HTMLInputElement> => {
    const externalEventHandlers = extractEventHandlers(externalProps);

    return {
      name,
      tabIndex: -1,
      'aria-hidden': true,
      required: required ? true : undefined,
      value: getSerializedValue(selectedOptionsMetadata),
      style: visuallyHiddenStyle,
      ...externalProps,
      onChange: createHandleHiddenInputChange(externalEventHandlers),
    };
  };

  return {
    state,
    dispatch,
    getButtonProps,
    getHiddenInputProps,
    getListboxProps,
    compoundParentContext,
    buttonRef: mergedButtonRef,
    listboxRef: mergedListRootRef,
  };
}

export { useSelect };
