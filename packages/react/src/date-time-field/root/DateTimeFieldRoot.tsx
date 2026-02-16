'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps, MakeOptional } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import { AmPmParameters, DateTimeFieldStore } from './DateTimeFieldStore';
import { DateFieldRootContext } from '../../date-field/root/DateFieldRootContext';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import {
  TemporalFieldSection,
  TemporalFieldStoreSharedParameters,
  TemporalFieldRootActions,
} from '../../date-field/utils/types';
import { TemporalValue } from '../../types';
import { useTemporalFieldRoot } from '../../date-field/utils/useTemporalFieldRoot';

/**
 * Groups all parts of the date-time field.
 * Renders a `<div>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Date Time Field](https://base-ui.com/react/components/unstable-date-time-field)
 */
export const DateTimeFieldRoot = React.forwardRef(function DateTimeFieldRoot(
  componentProps: DateTimeFieldRoot.Props,
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
    disabled: disabledProp,
    name: nameProp,
    id: idProp,
    inputRef: inputRefProp,
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
    placeholderGetters,
    actionsRef,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const fieldContext = useFieldRootContext();
  const adapter = useTemporalAdapter();
  const direction = useDirection();

  const id = useLabelableId({ id: idProp });
  const hiddenInputRef = useMergedRefs(inputRefProp, fieldContext.validation.inputRef);

  const parameters = React.useMemo(
    () => ({
      readOnly,
      disabled: disabledProp,
      required,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      format,
      ampm,
      step,
      name: nameProp,
      id,
      fieldContext,
      adapter,
      direction,
      minDate,
      maxDate,
      placeholderGetters,
    }),
    [
      readOnly,
      disabledProp,
      required,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      format,
      ampm,
      step,
      nameProp,
      id,
      fieldContext,
      adapter,
      direction,
      minDate,
      maxDate,
      placeholderGetters,
    ],
  );

  const store = useRefWithInit(() => new DateTimeFieldStore(parameters)).current;

  useIsoLayoutEffect(() => store.syncState(parameters), [store, parameters, adapter, direction]);

  React.useImperativeHandle(actionsRef, () => store.getActions(), [store]);

  const { state, hiddenInputProps, rootRef, resolvedChildren } = useTemporalFieldRoot({
    store,
    children,
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef],
    props: [store.rootEventHandlers, { children: resolvedChildren }, elementProps],
  });

  return (
    <DateFieldRootContext.Provider value={store}>
      <input {...hiddenInputProps} {...store.hiddenInputEventHandlers} ref={hiddenInputRef} />
      {element}
    </DateFieldRootContext.Provider>
  );
});

export interface DateTimeFieldRootState extends FieldRoot.State {
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

export interface DateTimeFieldRootProps
  extends
    Omit<BaseUIComponentProps<'div', DateTimeFieldRootState>, 'children'>,
    Omit<MakeOptional<TemporalFieldStoreSharedParameters<TemporalValue>, 'format'>, 'fieldContext'>,
    AmPmParameters {
  /**
   * The children of the component.
   * If a function is provided, it will be called with each section as its parameter.
   */
  children?: React.ReactNode | ((section: TemporalFieldSection) => React.ReactNode);
  /**
   * A ref to imperative actions.
   * - `clear`: Clears the field value.
   */
  actionsRef?: React.RefObject<DateTimeFieldRoot.Actions | null> | undefined;
}

export type DateTimeFieldRootActions = TemporalFieldRootActions;

export namespace DateTimeFieldRoot {
  export type Props = DateTimeFieldRootProps;
  export type State = DateTimeFieldRootState;
  export type Actions = DateTimeFieldRootActions;
}
