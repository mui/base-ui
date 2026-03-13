'use client';
import * as React from 'react';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps } from '../../utils/types';
import { dateFieldConfig, getDateFieldDefaultFormat } from './dateFieldConfig';
import { FieldRoot } from '../../field';
import { TemporalFieldRootActions } from '../utils/types';
import { useTemporalFieldRoot, UseTemporalFieldRootProps } from '../utils/useTemporalFieldRoot';

/**
 * Groups all parts of the date field.
 * Renders a `<div>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/unstable-date-field)
 */
export const DateFieldRoot = React.forwardRef(function DateFieldRoot(
  componentProps: DateFieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    children,
    // Form props
    required,
    readOnly,
    disabled,
    name,
    id,
    inputRef,
    // Value props
    onValueChange,
    defaultValue,
    value,
    timezone,
    referenceDate,
    format,
    // Validation props
    minDate,
    maxDate,
    // Other props
    actionsRef,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useTemporalAdapter();
  const resolvedFormat = format ?? getDateFieldDefaultFormat(adapter);

  return useTemporalFieldRoot({
    componentProps,
    forwardedRef,
    elementProps,
    config: dateFieldConfig,
    props: {
      children,
      actionsRef,
      inputRef,
      format: resolvedFormat,
      step: 1,
      required,
      readOnly,
      disabled,
      name,
      id,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      minDate,
      maxDate,
    },
  });
});

export interface DateFieldRootState extends FieldRoot.State {
  /**
   * Whether the user must enter a value before submitting a form.
   */
  required: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the user should be unable to change the field value.
   */
  readOnly: boolean;
}

export interface DateFieldRootProps
  extends
    Omit<BaseUIComponentProps<'div', DateFieldRootState>, 'children'>,
    Partial<Omit<UseTemporalFieldRootProps, 'step'>> {}

export type DateFieldRootActions = TemporalFieldRootActions;

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
  export type Actions = DateFieldRootActions;
}
