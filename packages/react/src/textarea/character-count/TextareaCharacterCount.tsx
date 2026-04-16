'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { TextareaCharacterCountDataAttributes } from './TextareaCharacterCountDataAttributes';

const APPROACHING_THRESHOLD = 0.8;

const stateAttributesMapping = {
  approaching(value: boolean) {
    if (value) {
      return { [TextareaCharacterCountDataAttributes.approaching]: '' } as Record<string, string>;
    }
    return null;
  },
};

/**
 * Displays the current character count relative to the maximum length.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Textarea](https://base-ui.com/react/components/textarea)
 */
export const TextareaCharacterCount = React.forwardRef(function TextareaCharacterCount(
  componentProps: TextareaCharacterCount.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, style, children, value, maxLength, ...elementProps } = componentProps;

  const count = value?.length ?? 0;
  const approaching =
    maxLength != null ? count / maxLength >= APPROACHING_THRESHOLD : false;

  const state: TextareaCharacterCountState = {
    approaching,
  };

  const element = useRenderElement('span', componentProps, {
    ref: forwardedRef,
    state,
    props: [elementProps],
    stateAttributesMapping,
  });

  // When children is a function, use it as a custom render
  if (typeof children === 'function') {
    return React.cloneElement(element, {}, children({ count, maxLength }));
  }

  // Default rendering: "X/Y" when maxLength is set, otherwise just "X"
  return React.cloneElement(
    element,
    {},
    maxLength != null ? `${count}/${maxLength}` : `${count}`,
  );
});

export interface TextareaCharacterCountState {
  /**
   * Whether the character count is approaching the maximum (above 80%).
   */
  approaching: boolean;
}

export interface TextareaCharacterCountProps
  extends Omit<BaseUIComponentProps<'span', TextareaCharacterCountState>, 'children'> {
  /**
   * The current value of the textarea.
   */
  value?: string | undefined;
  /**
   * The maximum character length. When set, the count displays as `"{count}/{maxLength}"`.
   */
  maxLength?: number | undefined;
  /**
   * Custom render function receiving `{ count, maxLength }`.
   * When omitted, renders `"{count}/{maxLength}"` or `"{count}"`.
   */
  children?:
    | ((params: { count: number; maxLength: number | undefined }) => React.ReactNode)
    | undefined;
}

export namespace TextareaCharacterCount {
  export type State = TextareaCharacterCountState;
  export type Props = TextareaCharacterCountProps;
}
