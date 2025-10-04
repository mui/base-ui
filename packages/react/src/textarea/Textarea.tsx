'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { fieldValidityMapping } from '../field/utils/constants';
import { BaseUIComponentProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';
import { useField } from '../field/useField';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import {
  BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../utils/createBaseUIEventDetails';
import { calculateTextareaHeight } from './calculateTextareaHeight';

/**
 * A native textarea element that automatically works with [Field](https://base-ui.com/react/components/field).
 * Renders an `<textarea>` element.
 *
 * Documentation: [Base UI Textarea](https://base-ui.com/react/components/textarea)
 */
export const Textarea = React.forwardRef(function Textarea(
  componentProps: Textarea.Props,
  forwardedRef: React.ForwardedRef<HTMLTextAreaElement>,
) {
  const {
    render,
    className,
    id: idProp,
    name: nameProp,
    value: valueProp,
    disabled: disabledProp = false,
    onValueChange,
    defaultValue,
    minRows,
    maxRows,
    style,
    ...elementProps
  } = componentProps;

  const placeholder = (elementProps as any)?.placeholder as string | undefined;

  const { state: fieldState, name: fieldName, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const state: Textarea.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled,
    }),
    [fieldState, disabled],
  );

  const {
    setControlId,
    labelId,
    setTouched,
    setDirty,
    validityData,
    setFocused,
    setFilled,
    validationMode,
  } = useFieldRootContext();

  const { getValidationProps, getInputValidationProps, commitValidation, inputRef } =
    useFieldControlValidation();

  const hiddenTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const heightRef = React.useRef<number | null>(null);

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useIsoLayoutEffect(() => {
    const hasExternalValue = valueProp != null;
    if (inputRef.current?.value || (hasExternalValue && valueProp !== '')) {
      setFilled(true);
    } else if (hasExternalValue && valueProp === '') {
      setFilled(false);
    }
  }, [inputRef, setFilled, valueProp]);

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Textarea',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;

  const setValue = useEventCallback(
    (nextValue: string, eventDetails: Textarea.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  useField({
    id,
    name,
    commitValidation,
    value,
    getValue: () => inputRef.current?.value,
    controlRef: inputRef,
  });

  useIsoLayoutEffect(() => {
    const el = inputRef.current;
    const hidden = hiddenTextareaRef.current;

    if (!el || !hidden || (minRows == null && maxRows == null)) {
      return undefined;
    }

    // Track the last applied overflow state so we avoid redundant writes.
    let lastIsOverflowing: boolean | null = null;

    const applyHeight = (target: number | null, isOverflowing: boolean) => {
      // Only write to the DOM when something actually changed.
      if (target == null) {
        const didClearHeight = heightRef.current !== null;
        const didOverflowChange = lastIsOverflowing !== isOverflowing;

        if (didClearHeight) {
          el.style.height = '';
          heightRef.current = null;
        }

        if (didOverflowChange) {
          const overflowValue = isOverflowing ? '' : 'hidden';
          if (el.style.overflowY !== overflowValue) {
            el.style.overflowY = overflowValue;
          }
          lastIsOverflowing = isOverflowing;
        }

        return;
      }

      const didHeightChange = heightRef.current !== target;
      const didOverflowChange = lastIsOverflowing !== isOverflowing;

      if (didHeightChange) {
        el.style.height = `${target}px`;
        heightRef.current = target;
      }

      if (didOverflowChange) {
        const overflowValue = isOverflowing ? '' : 'hidden';
        if (el.style.overflowY !== overflowValue) {
          el.style.overflowY = overflowValue;
        }
        lastIsOverflowing = isOverflowing;
      }
    };

    // performResize contains the expensive measurement call. Keep it isolated so
    // we can schedule/debounce it differently depending on the event source.
    const performResize = () => {
      const styles = calculateTextareaHeight(
        el as unknown as HTMLTextAreaElement,
        hidden as unknown as HTMLTextAreaElement,
        placeholder,
        minRows,
        maxRows,
      );
      if (!styles) {
        return;
      }

      const { outerHeightStyle, isOverflowing, rowsOccupied } = styles;

      // only apply height if we are not at minimum rows yet
      if (minRows != null) {
        const needsMoreThanMin = rowsOccupied > Number(minRows) + 0.0001;

        if (!needsMoreThanMin) {
          applyHeight(null, isOverflowing);
          return;
        }
      }

      applyHeight(outerHeightStyle, isOverflowing);
    };

    // Debounce identifier used for less-frequent triggers (resize, RO).
    let debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafId = 0;

    const schedulePerformResizeDebounced = () => {
      // Debounce expensive measurements similar to MUI to avoid doing them too frequently.
      const DEBOUNCE_MS = 166; // ~6fps; good tradeoff for resize/RO events
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
      }
      debounceTimeoutId = setTimeout(() => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(performResize);
        debounceTimeoutId = null;
      }, DEBOUNCE_MS);
    };

    const schedulePerformResizeImmediate = () => {
      // For input events we want a more immediate response; schedule via RAF.
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
        debounceTimeoutId = null;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(performResize);
    };

    // Initial measurement
    rafId = requestAnimationFrame(performResize);

    const onInput = () => {
      schedulePerformResizeImmediate();
    };

    el.addEventListener('input', onInput);
    window.addEventListener('resize', schedulePerformResizeDebounced);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        // Use the debounced scheduler for ResizeObserver notifications.
        schedulePerformResizeDebounced();
      });
      try {
        ro.observe(el);
        if (el.parentElement) {
          ro.observe(el.parentElement);
        }
      } catch (err) {
        // ignore observation errors
      }
    }

    return () => {
      el.removeEventListener('input', onInput);
      window.removeEventListener('resize', schedulePerformResizeDebounced);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
      }
      if (ro) {
        ro.disconnect();
      }
    };
  }, [inputRef, minRows, maxRows, placeholder]);

  const element = useRenderElement('textarea', componentProps, {
    ref: forwardedRef || undefined,
    state,
    props: [
      {
        id,
        disabled,
        name,
        ref: inputRef,
        rows: minRows || 2,
        'aria-labelledby': labelId,
        style,
        ...(isControlled ? { value } : { defaultValue }),
        onChange(event) {
          const inputValue = event.currentTarget.value;
          setValue(inputValue, createChangeEventDetails('none', event.nativeEvent));
          setDirty(inputValue !== validityData.initialValue);
          setFilled(inputValue !== '');
        },
        onFocus() {
          setFocused(true);
        },
        onBlur(event: React.FocusEvent<HTMLTextAreaElement>) {
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            commitValidation(event.currentTarget.value);
          }
        },
        onKeyDown(event) {
          if (
            event.currentTarget.tagName === 'TEXTAREA' &&
            event.key === 'Enter' &&
            event.shiftKey === true
          ) {
            setTouched(true);
            commitValidation(event.currentTarget.value);
          }
        },
      },
      getValidationProps(),
      getInputValidationProps(),
      elementProps,
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return React.createElement(
    React.Fragment,
    null,
    element,
    React.createElement('textarea', {
      'aria-hidden': true,
      readOnly: true,
      ref: hiddenTextareaRef,
      tabIndex: -1,
      style: {
        visibility: 'hidden',
        position: 'absolute',
        overflow: 'hidden',
        height: 0,
        top: 0,
        left: 0,
        transform: 'translateZ(0)',
        paddingTop: 0,
        paddingBottom: 0,
        ...(style as React.CSSProperties),
      },
    }),
  );
});

export namespace Textarea {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'textarea', State> {
    /**
     * Enable automatic height resizing by setting the minimum number of rows.
     */
    minRows?: number;
    /**
     * Limit automatic height resizing to this many rows.
     */
    maxRows?: number;
    /**
     * Callback fired when the `value` changes. Use when controlled.
     */
    onValueChange?: (value: string, eventDetails: ChangeEventDetails) => void;
    defaultValue?: React.ComponentProps<'textarea'>['defaultValue'];
  }

  export type ChangeEventReason = 'none';
  export type ChangeEventDetails = BaseUIChangeEventDetails<ChangeEventReason>;
}
