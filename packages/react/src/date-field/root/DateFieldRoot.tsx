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
import { DateFieldStore } from './DateFieldStore';
import { TemporalFieldRootPropsPlugin } from '../../utils/temporal/field/plugins/TemporalFieldRootPropsPlugin';
import { TemporalFieldRootContext } from '../../utils/temporal/field/TemporalFieldRootContext';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { ValidateDateValidationProps } from '../../utils/temporal/validateDate';
import { TemporalValue } from '../../types';
import { TemporalFieldStoreSharedParameters } from '../../utils/temporal/field/types';

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
    minDate,
    maxDate,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const fieldContext = useFieldRootContext();
  const adapter = useTemporalAdapter();
  const direction = useDirection();

  const id = useLabelableId({ id: idProp });
  const hiddenInputRef = useMergedRefs(inputRefProp, fieldContext.validation.inputRef);

  const validationProps: ValidateDateValidationProps = React.useMemo(
    () => ({ minDate, maxDate }),
    [minDate, maxDate],
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
      nameProp,
      id,
      fieldContext,
      adapter,
      direction,
      validationProps,
    ],
  );

  const store = useRefWithInit(() => new DateFieldStore(parameters)).current;

  useIsoLayoutEffect(() => store.syncState(parameters), [store, parameters, adapter, direction]);

  useOnMount(store.mountEffect);

  const inputProps = useStore(store, TemporalFieldRootPropsPlugin.selectors.hiddenInputProps);

  const state: DateFieldRootState = useStore(
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
    BaseUIComponentProps<'div', DateFieldRootState>,
    Omit<MakeOptional<TemporalFieldStoreSharedParameters<TemporalValue>, 'format'>, 'step'>,
    ValidateDateValidationProps {}

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
}
