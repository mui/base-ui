import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { getDateManager } from '../../utils/temporal/getDateManager';
import {
  TemporalFieldStore,
  TemporalFieldStoreParameters,
} from '../../utils/temporal/TemporalFieldStore';
import { BaseUIComponentProps } from '../../utils/types';
import { TemporalValue } from '../../types';
import { validateDate } from '../../utils/temporal/validateDate';
import { useRenderElement } from '../../utils/useRenderElement';

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
      minDate,
      maxDate,
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
    ],
  );

  const store = useRefWithInit(() => new TemporalFieldStore(parameters, adapter, manager)).current;

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children(EMPTY_OBJECT);
    }

    return children;
  }, [children]);

  return useRenderElement('div', componentProps, {
    // state,
    ref: forwardedRef,
    props: [{ children: resolvedChildren }, elementProps],
    // stateAttributesMapping,
  });
});

export interface DateFieldRootState {}

export interface DateFieldRootProps
  extends
    Omit<BaseUIComponentProps<'div', DateFieldRootState>, 'children'>,
    validateDate.ValidationProps,
    TemporalFieldStoreParameters<TemporalValue, validateDate.ReturnValue> {
  /**
   * The children of the component.
   * If a function is provided, it will be called with the public context as its parameter.
   */
  children?: React.ReactNode | ((parameters: {}) => React.ReactNode);
}

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
}
