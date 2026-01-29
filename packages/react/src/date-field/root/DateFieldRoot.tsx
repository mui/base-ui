'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { BaseUIComponentProps, MakeOptional } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import { DateFieldStore } from './DateFieldStore';
import { TemporalFieldRootContext } from '../../utils/temporal/field/TemporalFieldRootContext';
import { FieldRoot } from '../../field';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { ValidateDateValidationProps } from '../../utils/temporal/validateDate';
import { TemporalValue } from '../../types';
import {
  TemporalFieldSection,
  TemporalFieldStoreSharedParameters,
} from '../../utils/temporal/field/types';
import { useTemporalFieldRoot } from '../../utils/temporal/field/useTemporalFieldRoot';

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
    // Validation props
    minDate,
    maxDate,
    // Other props
    placeholderGetters,
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
      nameProp,
      id,
      fieldContext,
      adapter,
      direction,
      validationProps,
      placeholderGetters,
    ],
  );

  const store = useRefWithInit(() => new DateFieldStore(parameters)).current;

  useIsoLayoutEffect(() => store.syncState(parameters), [store, parameters, adapter, direction]);

  useOnMount(store.mountEffect);

  const { state, hiddenInputProps, rootProps, rootRef } = useTemporalFieldRoot({
    store,
    children,
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef],
    props: [rootProps, elementProps],
  });

  return (
    <TemporalFieldRootContext.Provider value={store}>
      <input
        {...hiddenInputProps}
        ref={hiddenInputRef}
        onChange={store.elementsProps.handleHiddenInputChange}
        onFocus={store.elementsProps.handleHiddenInputFocus}
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
    Omit<BaseUIComponentProps<'div', DateFieldRootState>, 'children'>,
    Omit<MakeOptional<TemporalFieldStoreSharedParameters<TemporalValue>, 'format'>, 'step'>,
    ValidateDateValidationProps {
  /**
   * The children of the component.
   * If a function is provided, it will be called with each section as its parameter.
   */
  children?: React.ReactNode | ((section: TemporalFieldSection) => React.ReactNode);
}

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
}
