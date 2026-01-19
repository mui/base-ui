'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import { TimeFieldRootContext } from './TimeFieldRootContext';
import { TimeFieldStore, TimeFieldStoreParameters } from './TimeFieldStore';
import { TemporalFieldRootPropsPlugin } from '../../utils/temporal/field/TemporalFieldRootPropsPlugin';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { DateFieldRootContext } from '../../date-field/root/DateFieldRootContext';

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
    // Validation props
    minTime,
    maxTime,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const fieldContext = useFieldRootContext();

  const adapter = useTemporalAdapter();

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
      minTime,
      maxTime,
      format,
      name: nameProp,
      id,
      fieldContext,
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
      minTime,
      maxTime,
      format,
      nameProp,
      id,
      fieldContext,
    ],
  );

  const direction = useDirection();
  const store = useRefWithInit(() => new TimeFieldStore(parameters, adapter, direction)).current;

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
    <TimeFieldRootContext.Provider value={store}>
      <DateFieldRootContext.Provider value={store}>
        <input
          {...inputProps}
          ref={hiddenInputRef}
          onChange={store.rootProps.onHiddenInputChange}
          onFocus={store.rootProps.onHiddenInputFocus}
        />
        {element}
      </DateFieldRootContext.Provider>
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
