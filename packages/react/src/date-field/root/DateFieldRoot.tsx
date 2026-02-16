'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
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
import { TemporalValue } from '../../types';
import {
  TemporalFieldSection,
  TemporalFieldStoreSharedParameters,
  TemporalFieldRootActions,
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

  const store = useRefWithInit(() => new DateFieldStore(parameters)).current;

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
    <TemporalFieldRootContext.Provider value={store}>
      <input {...hiddenInputProps} {...store.hiddenInputEventHandlers} ref={hiddenInputRef} />
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
    Omit<
      MakeOptional<TemporalFieldStoreSharedParameters<TemporalValue>, 'format'>,
      'fieldContext' | 'step'
    > {
  /**
   * The children of the component.
   * If a function is provided, it will be called with each section as its parameter.
   */
  children?: React.ReactNode | ((section: TemporalFieldSection) => React.ReactNode);
  /**
   * A ref to imperative actions.
   * - `clear`: Clears the field value.
   */
  actionsRef?: React.RefObject<DateFieldRoot.Actions | null> | undefined;
}

export type DateFieldRootActions = TemporalFieldRootActions;

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
  export type Actions = DateFieldRootActions;
}
