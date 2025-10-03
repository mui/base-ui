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

    const getStyleValue = (str: string) => parseInt(str, 10) || 0;

    const calculate = () => {
      const computedStyle = getComputedStyle(el);

      let width = computedStyle.width;
      if (!width || width === '0px') {
        const rect = el.getBoundingClientRect();
        width = rect.width ? `${rect.width}px` : width;
      }

      if (!width || width === '0px') {
        return null;
      }

      const styleToCopy = [
        'boxSizing',
        'width',
        'paddingTop',
        'paddingBottom',
        'paddingLeft',
        'paddingRight',
        'borderTopWidth',
        'borderBottomWidth',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'letterSpacing',
        'textTransform',
        'textIndent',
        'lineHeight',
        'whiteSpace',
      ];

      hidden.style.width = width;
      for (const propName of styleToCopy) {
        hidden.style[propName as keyof Omit<CSSStyleDeclaration, 'length' | 'parentRule'>] = (computedStyle as any)[propName];
      }

      hidden.style.whiteSpace =
        computedStyle.whiteSpace === 'pre-wrap' || computedStyle.whiteSpace === 'pre-line'
          ? computedStyle.whiteSpace
          : 'pre-wrap';

      hidden.value = el.value || placeholder || 'x';
      if (hidden.value.slice(-1) === '\n') {
        hidden.value += ' ';
      }

      const boxSizing = computedStyle.boxSizing;
      const paddingTop = getStyleValue(computedStyle.paddingTop);
      const paddingBottom = getStyleValue(computedStyle.paddingBottom);
      const padding = paddingTop + paddingBottom;
      const border =
        getStyleValue(computedStyle.borderBottomWidth) +
        getStyleValue(computedStyle.borderTopWidth);

      const innerScrollHeight = hidden.scrollHeight;

      hidden.value = 'x';
      const singleRowScrollHeight = hidden.scrollHeight || 1;
      const singleRowContentHeight = Math.max(singleRowScrollHeight - padding, 1);

      const currentContentHeight = Math.max(innerScrollHeight - padding, 0);

      let desiredContentHeight = currentContentHeight;
      if (minRows) {
        desiredContentHeight = Math.max(
          Number(minRows) * singleRowContentHeight,
          desiredContentHeight,
        );
      }
      if (maxRows) {
        desiredContentHeight = Math.min(
          Number(maxRows) * singleRowContentHeight,
          desiredContentHeight,
        );
      }
      desiredContentHeight = Math.max(desiredContentHeight, singleRowContentHeight);

      const outerHeightStyle =
        boxSizing === 'border-box' ? desiredContentHeight + padding + border : desiredContentHeight;

      const isOverflowing = currentContentHeight > desiredContentHeight + 1;

      const rowsOccupied = currentContentHeight / singleRowContentHeight;

      return {
        outerHeightStyle,
        isOverflowing,
        rowsOccupied,
      } as { outerHeightStyle: number; isOverflowing: boolean; rowsOccupied: number };
    };

    const applyHeight = (target: number | null, isOverflowing: boolean) => {
      if (target == null) {
        if (heightRef.current !== null) {
          el.style.height = '';
          heightRef.current = null;
        }

        const overflowValue = isOverflowing ? 'auto' : 'hidden';
        if (el.style.overflowY !== overflowValue) {
          el.style.overflowY = overflowValue;
        }

        return;
      }

      if (heightRef.current !== target) {
        el.style.height = `${target}px`;
        heightRef.current = target;
      }

      const overflowValue = isOverflowing ? 'auto' : 'hidden';
      if (el.style.overflowY !== overflowValue) {
        el.style.overflowY = overflowValue;
      }
    };

    const resize = () => {
      const styles = calculate();
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

    let rafId = 0 as number;
    rafId = requestAnimationFrame(resize);

    el.addEventListener('input', resize);
    window.addEventListener('resize', resize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(resize);
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
      el.removeEventListener('input', resize);
      window.removeEventListener('resize', resize);
      if (rafId) {
        cancelAnimationFrame(rafId);
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
        ...(minRows != null ? { rows: minRows } : {}),
        'aria-labelledby': labelId,
        ...(minRows != null && !(style as any)?.height
          ? {
              style: {
                ...(style as React.CSSProperties),
                height: 'auto',
                resize: 'none',
              },
            }
          : { style }),
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
