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
    readOnly,
    disabled,
    invalid,
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

  const adapter = useTemporalAdapter();

  const parameters = React.useMemo(
    () => ({
      readOnly,
      disabled,
      invalid,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      minDate,
      maxDate,
      format,
    }),
    [
      readOnly,
      disabled,
      invalid,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      minDate,
      maxDate,
      format,
    ],
  );

  const direction = useDirection();
  const store = useRefWithInit(() => new DateFieldStore(parameters, adapter, direction)).current;

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

  // TODO: Improve memoization
  const inputProps = useStore(store, TemporalFieldRootPropsPlugin.selectors.hiddenInputProps);

  const element = useRenderElement('div', componentProps, {
    // state,
    ref: forwardedRef,
    props: [elementProps],
    // stateAttributesMapping,
  });

  return (
    <DateFieldRootContext.Provider value={store}>
      <input {...inputProps} />
      {element}
    </DateFieldRootContext.Provider>
  );
});

export interface DateFieldRootState {}

export interface DateFieldRootProps
  extends BaseUIComponentProps<'div', DateFieldRootState>, DateFieldStoreParameters {}

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
}
