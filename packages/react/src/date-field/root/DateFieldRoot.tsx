'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import { DateFieldRootContext } from './DateFieldRootContext';
import { DateFieldStore, DateFieldStoreParameters } from './DateFieldStore';
import { TemporalFieldRootPropsPlugin } from '../../utils/temporal/field/TemporalFieldRootPropsPlugin';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { TemporalFieldValuePlugin } from '../../utils/temporal/field/TemporalFieldValuePlugin';

/**
 * Groups all parts of the date field.
 * Renders a `<div>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/date-field)
 */
export const DateFieldRoot = React.forwardRef(function DateFieldRoot(
  componentProps: DateFieldRoot.Props,
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
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const {
    // setDirty,
    // validityData,
    disabled: fieldDisabled,
    setFilled,
    // invalid,
    name: fieldName,
    state: fieldState,
    // validation,
    // shouldValidateOnChange,
  } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const adapter = useTemporalAdapter();

  const parameters = React.useMemo(
    () => ({
      readOnly,
      disabled,
      required,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      minDate,
      maxDate,
      format,
      name,
    }),
    [
      readOnly,
      disabled,
      required,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      minDate,
      maxDate,
      format,
      name,
    ],
  );

  const direction = useDirection();
  const store = useRefWithInit(() => new DateFieldStore(parameters, adapter, direction)).current;

  // TODO: Replace with useStoreEffect?
  const valueInState = useStore(store, TemporalFieldValuePlugin.selectors.value);
  useIsoLayoutEffect(() => {
    setFilled(valueInState !== null);
  }, [setFilled, valueInState]);

  useIsoLayoutEffect(
    () => store.tempUpdate(parameters, adapter, direction),
    [store, parameters, adapter, direction],
  );

  useOnMount(store.disposeEffect);

  // TODO: Make this logic more reliable
  useOnMount(() => {
    store.dom.syncSelectionToDOM();
    store.subscribe(store.dom.syncSelectionToDOM);
  });

  const inputProps = useStore(store, TemporalFieldRootPropsPlugin.selectors.hiddenInputProps);

  const state: DateFieldRootState = useStore(
    store,
    TemporalFieldRootPropsPlugin.selectors.rootState,
    fieldState,
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps],
  });

  return (
    <DateFieldRootContext.Provider value={store}>
      <input
        {...inputProps}
        onChange={store.rootProps.onHiddenInputChange}
        onFocus={store.rootProps.onHiddenInputFocus}
      />
      {element}
    </DateFieldRootContext.Provider>
  );
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
  extends BaseUIComponentProps<'div', DateFieldRootState>, DateFieldStoreParameters {}

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
}
