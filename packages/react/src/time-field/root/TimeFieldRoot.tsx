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
import { TimeFieldRootContext } from './TimeFieldRootContext';
import { TimeFieldStore, TimeFieldStoreParameters } from './TimeFieldStore';
import { TemporalFieldRootPropsPlugin } from '../../utils/temporal/field/TemporalFieldRootPropsPlugin';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { TemporalFieldValuePlugin } from '../../utils/temporal/field/TemporalFieldValuePlugin';

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
    disabled,
    // Value props
    onValueChange,
    defaultValue,
    value,
    timezone,
    referenceDate,
    format,
    // Validation props
    minTime,
    maxTime,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useTemporalAdapter();

  const parameters = React.useMemo(
    () => ({
      readOnly,
      disabled,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      minTime,
      maxTime,
      format,
    }),
    [
      readOnly,
      disabled,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      minTime,
      maxTime,
      format,
    ],
  );

  const { state: fieldState, setFilled } = useFieldRootContext();

  const direction = useDirection();
  const store = useRefWithInit(() => new TimeFieldStore(parameters, adapter, direction)).current;

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

  // TODO: Add onChange?
  const inputProps = useStore(store, TemporalFieldRootPropsPlugin.selectors.hiddenInputProps);

  const state: TimeFieldRootState = useStore(
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
    <TimeFieldRootContext.Provider value={store}>
      <input {...inputProps} />
      {element}
    </TimeFieldRootContext.Provider>
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
  extends BaseUIComponentProps<'div', TimeFieldRootState>, TimeFieldStoreParameters {}

export namespace TimeFieldRoot {
  export type Props = TimeFieldRootProps;
  export type State = TimeFieldRootState;
}
