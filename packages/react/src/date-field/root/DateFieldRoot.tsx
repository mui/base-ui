import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { getDateManager } from '../../utils/temporal/getDateManager';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import { BaseUIComponentProps } from '../../utils/types';
import { TemporalValue } from '../../types';
import { validateDate } from '../../utils/temporal/validateDate';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider';
import {
  TemporalFieldStorePublicParameters,
  TemporalFieldValueManager,
} from '../../utils/temporal/field/types';
import { areDatesEqual } from '../../utils/temporal/date-helpers';
import { DateFieldRootContext } from './DateFieldRootContext';

const dateFieldValueManager: TemporalFieldValueManager<TemporalValue> = {
  emptyValue: null,
  areValuesEqual: areDatesEqual,
  getSectionsFromValue: (date, getSectionsFromDate) => getSectionsFromDate(date),
  getDateFromSection: (value) => value,
  updateDateInValue: (value, activeSection, activeDate) => activeDate,
  parseValueStr: (valueStr, referenceValue, parseDate) =>
    parseDate(valueStr.trim(), referenceValue),
  getInitialReferenceValue: ({ value, referenceDate, ...params }) => {
    if (params.adapter.isValid(value)) {
      return value;
    }

    if (referenceDate != null) {
      return referenceDate;
    }

    return getDefaultReferenceDate(params);
  },
};

/**
 * Groups all parts of the date field.
 * Renders a `<div>` element.
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
    // Children
    children,
    // Validation props
    minDate,
    maxDate,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useTemporalAdapter();
  const manager = React.useMemo(() => getDateManager(adapter), [adapter]);

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
      format: format ?? adapter.formats.localizedNumericDate,
      minDate,
      maxDate,
    }),
    [
      adapter,
      readOnly,
      disabled,
      invalid,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      format,
      minDate,
      maxDate,
    ],
  );

  const direction = useDirection();
  const store = useRefWithInit(
    () => new TemporalFieldStore(parameters, adapter, manager, dateFieldValueManager, direction),
  ).current;

  const element = useRenderElement('div', componentProps, {
    // state,
    ref: forwardedRef,
    props: [elementProps],
    // stateAttributesMapping,
  });

  return <DateFieldRootContext.Provider value={store}>{element}</DateFieldRootContext.Provider>;
});

export interface DateFieldRootState {}

export interface DateFieldRootProps
  extends
    BaseUIComponentProps<'div', DateFieldRootState>,
    validateDate.ValidationProps,
    TemporalFieldStorePublicParameters<TemporalValue, validateDate.ReturnValue> {}

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
}
