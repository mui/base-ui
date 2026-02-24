'use client';
import * as React from 'react';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps } from '../../utils/types';
import { AmPmParameters, getTimeFieldDefaultFormat, timeFieldConfig } from './timeFieldConfig';
import { FieldRoot } from '../../field';
import { TemporalFieldRootActions } from '../../date-field/utils/types';
import {
  useTemporalFieldRoot,
  UseTemporalFieldRootProps,
} from '../../date-field/utils/useTemporalFieldRoot';

/**
 * Groups all parts of the time field.
 * Renders a `<div>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Time Field](https://base-ui.com/react/components/unstable-time-field)
 */
export const TimeFieldRoot = React.forwardRef(function TimeFieldRoot(
  componentProps: TimeFieldRoot.Props,
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
    ampm,
    step,
    // Validation props
    minDate,
    maxDate,
    // Other props
    actionsRef,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useTemporalAdapter();
  const resolvedFormat = format ?? getTimeFieldDefaultFormat(adapter, ampm);

  return useTemporalFieldRoot({
    componentProps,
    forwardedRef,
    elementProps,
    config: timeFieldConfig,
    props: {
      children,
      actionsRef,
      inputRef,
      format: resolvedFormat,
      step: step ?? 1,
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

export interface TimeFieldRootState extends FieldRoot.State {
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

export interface TimeFieldRootProps
  extends
    Omit<BaseUIComponentProps<'div', TimeFieldRootState>, 'children'>,
    Partial<UseTemporalFieldRootProps>,
    AmPmParameters {}

export type TimeFieldRootActions = TemporalFieldRootActions;

export namespace TimeFieldRoot {
  export type Props = TimeFieldRootProps;
  export type State = TimeFieldRootState;
  export type Actions = TimeFieldRootActions;
}
