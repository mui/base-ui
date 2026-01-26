'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps, MakeOptional } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import { AmPmParameters, TimeFieldStore } from './TimeFieldStore';
import { TemporalFieldRootPropsPlugin } from '../../utils/temporal/field/plugins/TemporalFieldRootPropsPlugin';
import { TemporalFieldRootContext } from '../../utils/temporal/field/TemporalFieldRootContext';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { ValidateTimeValidationProps } from '../../utils/temporal/validateTime';
import { TemporalFieldStoreSharedParameters } from '../../utils/temporal/field/types';
import { TemporalValue } from '../../types';

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
    minTime,
    maxTime,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const fieldContext = useFieldRootContext();
  const adapter = useTemporalAdapter();
  const direction = useDirection();

  const id = useLabelableId({ id: idProp });
  const hiddenInputRef = useMergedRefs(inputRefProp, fieldContext.validation.inputRef);

  const validationProps: ValidateTimeValidationProps = React.useMemo(
    () => ({ minTime, maxTime }),
    [minTime, maxTime],
  );

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
      validationProps,
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
      validationProps,
    ],
  );

  const store = useRefWithInit(() => new TimeFieldStore(parameters)).current;

  useIsoLayoutEffect(() => store.syncState(parameters), [store, parameters, adapter, direction]);

  useOnMount(store.mountEffect);

  const inputProps = useStore(store, TemporalFieldRootPropsPlugin.selectors.hiddenInputProps);

  const state: TimeFieldRootState = useStore(
    store,
    TemporalFieldRootPropsPlugin.selectors.rootState,
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps],
  });

  return (
    <TemporalFieldRootContext.Provider value={store}>
      <input
        {...inputProps}
        ref={hiddenInputRef}
        onChange={store.rootProps.onHiddenInputChange}
        onFocus={store.rootProps.onHiddenInputFocus}
      />
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
  extends
    BaseUIComponentProps<'div', TimeFieldRootState>,
    MakeOptional<TemporalFieldStoreSharedParameters<TemporalValue>, 'format'>,
    ValidateTimeValidationProps,
    AmPmParameters {}

export namespace TimeFieldRoot {
  export type Props = TimeFieldRootProps;
  export type State = TimeFieldRootState;
}
