'use client';
import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useSharedCalendarRootVisibleDateContext } from '../root/SharedCalendarRootVisibleDateContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { TemporalSupportedObject } from '../../models';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';

const InnerCalendarSetVisibleMonth = React.forwardRef(function InnerCalendarSetVisibleMonth(
  componentProps: InnerCalendarSetVisibleMonthProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, ctx, target, ...elementProps } = componentProps;

  const state: CalendarSetVisibleMonth.State = React.useMemo(
    () => ({ disabled: ctx.isDisabled }),
    [ctx.isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      { type: 'button', disabled: ctx.isDisabled, onClick: ctx.setTarget, tabIndex: 0 },
      elementProps,
    ],
  });

  return element;
});

const MemoizedInnerCalendarSetVisibleMonth = React.memo(InnerCalendarSetVisibleMonth);

/**
 * Displays an element to navigation to a given month in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarSetVisibleMonth = React.forwardRef(function CalendarSetVisibleMonth(
  props: CalendarSetVisibleMonth.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { visibleDate } = useSharedCalendarRootVisibleDateContext();
  const { monthPageSize, disabled, dateValidationProps, setVisibleDate } =
    useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const { ref: listItemRef } = useCompositeListItem();
  const ref = useForkRef(forwardedRef, listItemRef);

  const targetDate = React.useMemo(() => {
    if (props.target === 'previous') {
      return adapter.addMonths(visibleDate, -monthPageSize);
    }

    if (props.target === 'next') {
      return adapter.addMonths(visibleDate, monthPageSize);
    }

    return adapter.setYear(
      adapter.setMonth(visibleDate, adapter.getMonth(props.target)),
      adapter.getYear(props.target),
    );
  }, [visibleDate, monthPageSize, adapter, props.target]);

  const isDisabled = React.useMemo(() => {
    if (disabled) {
      return true;
    }

    // TODO: Check if the logic below works correctly when multiple months are rendered at once.
    const isMovingBefore = adapter.isBefore(targetDate, visibleDate);

    // All the months before the visible ones are fully disabled, we skip the navigation.
    if (isMovingBefore) {
      return adapter.isAfter(adapter.startOfMonth(dateValidationProps.minDate), targetDate);
    }

    // All the months after the visible ones are fully disabled, we skip the navigation.
    return adapter.isBefore(adapter.startOfMonth(dateValidationProps.maxDate), targetDate);
  }, [
    disabled,
    dateValidationProps.minDate,
    dateValidationProps.maxDate,
    visibleDate,
    targetDate,
    adapter,
  ]);

  // TODO: Uncomment and apply the correct tabIndex if we add month grid/list parts.
  // const canCellBeTabbed = sharedMonthListOrGridContext?.canCellBeTabbed;
  // const isTabbable = React.useMemo(() => {
  //   // If the button is not inside a month list or grid, then it is always tabbable.
  //   if (canCellBeTabbed == null) {
  //     return true;
  //   }

  //   return canCellBeTabbed(targetDate);
  // }, [canCellBeTabbed, targetDate]);

  const setTarget = useEventCallback(() => {
    if (isDisabled) {
      return;
    }
    setVisibleDate(targetDate, false);
  });

  const ctx = React.useMemo<InnerCalendarSetVisibleMonthContext>(
    () => ({ setTarget, isDisabled }),
    [setTarget, isDisabled],
  );

  return <MemoizedInnerCalendarSetVisibleMonth ref={ref} {...props} ctx={ctx} />;
});

export namespace CalendarSetVisibleMonth {
  export interface State {
    /**
     * Whether the button is disabled.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * The month to navigate to.
     */
    target: 'previous' | 'next' | TemporalSupportedObject;
  }
}

interface InnerCalendarSetVisibleMonthProps extends CalendarSetVisibleMonth.Props {
  /**
   * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
   */
  ctx: InnerCalendarSetVisibleMonthContext;
}

interface InnerCalendarSetVisibleMonthContext {
  setTarget: () => void;
  isDisabled: boolean;
}
