'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useTranslations } from '../../localization-provider/LocalizationContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { useField } from '../../field/useField';
import { TemporalValue } from '../../types';
import { TemporalFieldStore } from './TemporalFieldStore';
import { DateFieldRootContext } from '../root/DateFieldRootContext';
import { DateFieldSectionList } from '../section-list/DateFieldSectionList';
import {
  TemporalFieldStoreParameters,
  TemporalFieldSection,
  TemporalFieldConfiguration,
  TemporalFieldRootActions,
} from './types';

export interface UseTemporalFieldRootProps extends Omit<
  TemporalFieldStoreParameters<TemporalValue>,
  'adapter' | 'direction' | 'translations' | 'fieldContext'
> {
  /**
   * The children of the component.
   * If a function is provided, it will be called with each section as its parameter.
   */
  children?: React.ReactNode | ((section: TemporalFieldSection, index: number) => React.ReactNode);
  /**
   * A ref to imperative actions.
   * - `clear`: Clears the field value.
   */
  actionsRef?: React.RefObject<TemporalFieldRootActions | null> | undefined;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
}

interface UseTemporalFieldRootParameters {
  // Rendering infrastructure
  /** The original componentProps, passed through to useRenderElement. */
  componentProps: Record<string, any>;
  /** The forwarded ref from React.forwardRef. */
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  /** Rest props to forward to the DOM element. */
  elementProps: Record<string, any>;

  // Field type configuration
  /** The static config object for this field type. */
  config: TemporalFieldConfiguration<TemporalValue>;

  // Component props (from the Root's componentProps, with defaults applied)
  props: UseTemporalFieldRootProps;
}

/**
 * Hook managing the root state and rendering of a temporal field component.
 * Returns the full rendered output (context provider + hidden input + element).
 */
export function useTemporalFieldRoot(
  parameters: UseTemporalFieldRootParameters,
): React.JSX.Element {
  const { componentProps, forwardedRef, elementProps, config, props } = parameters;
  const {
    children,
    actionsRef,
    inputRef: inputRefProp,
    format,
    step,
    required,
    readOnly,
    disabled,
    name,
    id: idProp,
    onValueChange,
    defaultValue,
    value,
    timezone,
    referenceDate,
    minDate,
    maxDate,
  } = props;

  const fieldContext = useFieldRootContext();
  const adapter = useTemporalAdapter();
  const translations = useTranslations();
  const direction = useDirection();
  const id = useLabelableId({ id: idProp });
  const hiddenInputRef = useMergedRefs(inputRefProp, fieldContext.validation.inputRef);

  const store = useRefWithInit(
    () =>
      new TemporalFieldStore(
        {
          readOnly,
          disabled,
          required,
          onValueChange,
          defaultValue,
          value,
          timezone,
          referenceDate,
          format,
          step,
          name,
          id,
          fieldContext,
          adapter,
          translations,
          direction,
          minDate,
          maxDate,
        },
        config,
      ),
  ).current;

  store.useContextCallback('onValueChange', onValueChange);

  store.useSyncedValues({
    rawFormat: format,
    adapter,
    translations,
    direction,
    config,
    minDate,
    maxDate,
    referenceDateProp: referenceDate ?? null,
    required: required ?? false,
    disabledProp: disabled ?? false,
    readOnly: readOnly ?? false,
    nameProp: name,
    id,
    timezoneProp: timezone,
    step,
    fieldContext: fieldContext ?? null,
  });

  store.useControlledProp('valueProp', value);

  React.useImperativeHandle(actionsRef, () => store.getActions(), [store]);

  const hiddenInputProps = store.useState('hiddenInputProps');
  const state = store.useState('rootState');
  const useFieldParams = store.useState('useFieldParams');

  useField(useFieldParams);
  useOnMount(store.mountEffect);

  const resolvedChildren =
    typeof children === 'function' ? (
      <DateFieldSectionList>{children}</DateFieldSectionList>
    ) : (
      children
    );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, useFieldParams.controlRef],
    props: [store.rootEventHandlers, { children: resolvedChildren }, elementProps],
  });

  return (
    <DateFieldRootContext.Provider value={store}>
      <input {...hiddenInputProps} {...store.hiddenInputEventHandlers} ref={hiddenInputRef} />
      {element}
    </DateFieldRootContext.Provider>
  );
}
