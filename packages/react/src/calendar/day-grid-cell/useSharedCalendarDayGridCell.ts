import * as React from 'react';
import { TemporalSupportedObject } from '../../models';
import { SharedCalendarDayGridCellContext } from './SharedCalendarDayGridCellContext';
import { HTMLProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';

export function useSharedCalendarDayGridCell(parameters: useSharedCalendarDayGridCell.Parameters) {
  const { ctx, value } = parameters;

  const adapter = useTemporalAdapter();

  const props: HTMLProps = {
    role: 'gridcell',
    'aria-disabled': (ctx.isDisabled ?? ctx.isUnavailable) ? true : undefined,
    'aria-colindex': adapter.getDayOfWeek(value),
  };

  const context: SharedCalendarDayGridCellContext = React.useMemo(
    () => ({
      value: parameters.value,
      isDisabled: ctx.isDisabled,
      isUnavailable: ctx.isUnavailable,
    }),
    [ctx.isDisabled, ctx.isUnavailable, parameters.value],
  );

  return { props, context };
}

export namespace useSharedCalendarDayGridCell {
  export interface PublicParameters {
    /**
     * The value to select when this cell is clicked.
     */
    value: TemporalSupportedObject;
  }

  export interface Parameters extends PublicParameters {
    /**
     * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
     */
    ctx: Context;
  }

  export interface ReturnValue {
    props: HTMLProps;
    /**
     * The context to expose to the children components.
     */
    context: SharedCalendarDayGridCellContext;
  }

  export interface Context {
    isDisabled: boolean;
    isUnavailable: boolean;
  }
}
