import * as React from 'react';
import { TemporalSupportedObject } from '../../models';
import { SharedCalendarDayGridCellContext } from './SharedCalendarDayGridCellContext';
import { HTMLProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useSelector } from '../../utils/store';
import { useSharedCalendarDayGridBodyContext } from '../day-grid-body/SharedCalendarDayGridBodyContext';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { selectors } from '../store';

export function useSharedCalendarDayGridCell(parameters: useSharedCalendarDayGridCell.Parameters) {
  const { value } = parameters;
  const adapter = useTemporalAdapter();
  const { store } = useSharedCalendarRootContext();
  const { month } = useSharedCalendarDayGridBodyContext();

  const isDisabled = useSelector(store, selectors.isDayCellDisabled, adapter, value);

  const isUnavailable = useSelector(store, selectors.isDayCellUnavailable, value);

  const isOutsideCurrentMonth = React.useMemo(
    () => (month == null ? false : !adapter.isSameMonth(month, value)),
    [month, value, adapter],
  );

  const props: HTMLProps = {
    role: 'gridcell',
    'aria-disabled': isDisabled || isOutsideCurrentMonth || isUnavailable ? true : undefined,
    'aria-colindex': adapter.getDayOfWeek(value),
  };

  const context: SharedCalendarDayGridCellContext = React.useMemo(
    () => ({
      value,
      isDisabled,
      isUnavailable,
      isOutsideCurrentMonth,
    }),
    [isDisabled, isUnavailable, isOutsideCurrentMonth, value],
  );

  return { props, context };
}

export namespace useSharedCalendarDayGridCell {
  export interface Parameters {
    /**
     * The value to select when this cell is clicked.
     */
    value: TemporalSupportedObject;
  }

  export interface ReturnValue {
    props: HTMLProps;
    /**
     * The context to expose to the children components.
     */
    context: SharedCalendarDayGridCellContext;
  }
}
