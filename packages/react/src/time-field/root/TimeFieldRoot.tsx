'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps, MakeOptional } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import { AmPmParameters, TimeFieldStore } from './TimeFieldStore';
import { TemporalFieldRootContext } from '../../utils/temporal/field/TemporalFieldRootContext';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import {
  TemporalFieldSection,
  TemporalFieldStoreSharedParameters,
  TemporalFieldRootActions,
} from '../../utils/temporal/field/types';
import { TemporalValue } from '../../types';
import { useTemporalFieldRoot } from '../../utils/temporal/field/useTemporalFieldRoot';

/**
 * Groups all parts of the time field.
 * Renders a `<div>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Time Field](https://base-ui.com/react/components/time-field)
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
      children,
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
      children,
    ],
  );

  const store = useRefWithInit(() => new TimeFieldStore(parameters)).current;

  useIsoLayoutEffect(() => store.syncState(parameters), [store, parameters, adapter, direction]);

  React.useImperativeHandle(actionsRef, () => store.getActions(), [store]);

  const { state, hiddenInputProps, rootProps, rootRef } = useTemporalFieldRoot({
    store,
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef],
    props: [rootProps, elementProps],
  });

  return (
    <TemporalFieldRootContext.Provider value={store}>
      <input {...hiddenInputProps} ref={hiddenInputRef} />
      {element}
    </TemporalFieldRootContext.Provider>
  );
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
  extends Omit<BaseUIComponentProps<'div', TimeFieldRootState>, 'children'>,
    MakeOptional<TemporalFieldStoreSharedParameters<TemporalValue>, 'format'>,
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
  actionsRef?: React.RefObject<TimeFieldRoot.Actions | null> | undefined;
}

export type TimeFieldRootActions = TemporalFieldRootActions;

export namespace TimeFieldRoot {
  export type Props = TimeFieldRootProps;
  export type State = TimeFieldRootState;
  export type Actions = TimeFieldRootActions;
}
