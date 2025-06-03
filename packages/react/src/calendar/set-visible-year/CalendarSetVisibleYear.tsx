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

const InnerCalendarSetVisibleYear = React.forwardRef(function InnerCalendarSetVisibleYear(
  componentProps: InnerCalendarSetVisibleYearProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, ctx, target, ...elementProps } = componentProps;

  const state: CalendarSetVisibleYear.State = React.useMemo(
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

const MemoizedInnerCalendarSetVisibleYear = React.memo(InnerCalendarSetVisibleYear);

/**
 * Displays an element to navigation to a given year in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarSetVisibleYear = React.forwardRef(function CalendarSetVisibleYear(
  props: CalendarSetVisibleYear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { visibleDate } = useSharedCalendarRootVisibleDateContext();
  const { yearPageSize, disabled, dateValidationProps, setVisibleDate } =
    useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const { ref: listItemRef } = useCompositeListItem();
  const ref = useForkRef(forwardedRef, listItemRef);

  const targetDate = React.useMemo(() => {
    if (props.target === 'previous') {
      return adapter.addYears(visibleDate, -yearPageSize);
    }

    if (props.target === 'next') {
      return adapter.addYears(visibleDate, yearPageSize);
    }

    return adapter.setYear(visibleDate, adapter.getYear(props.target));
  }, [visibleDate, adapter, props.target, yearPageSize]);

  const isDisabled = React.useMemo(() => {
    if (disabled) {
      return true;
    }

    const isMovingBefore = adapter.isBefore(targetDate, visibleDate);

    // All the years before the visible ones are fully disabled, we skip the navigation.
    if (isMovingBefore) {
      return adapter.isAfter(adapter.startOfYear(dateValidationProps.minDate), targetDate);
    }

    // All the years after the visible ones are fully disabled, we skip the navigation.
    return adapter.isBefore(adapter.startOfYear(dateValidationProps.maxDate), targetDate);
  }, [
    disabled,
    dateValidationProps.minDate,
    dateValidationProps.maxDate,
    visibleDate,
    targetDate,
    adapter,
  ]);

  // TODO: Uncomment and apply the correct tabIndex if we add month grid/list parts.
  // const canCellBeTabbed = sharedYearListOrGridContext?.canCellBeTabbed;
  // const isTabbable = React.useMemo(() => {
  //   // If the button is not inside a year list or grid, then it is always tabbable.
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

  const ctx = React.useMemo<InnerCalendarSetVisibleYearContext>(
    () => ({ setTarget, isDisabled }),
    [setTarget, isDisabled],
  );

  return <MemoizedInnerCalendarSetVisibleYear ref={ref} {...props} ctx={ctx} />;
});

export namespace CalendarSetVisibleYear {
  export interface State {
    /**
     * Whether the button is disabled.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * The year to navigate to.
     */
    target: 'previous' | 'next' | TemporalSupportedObject;
  }
}

interface InnerCalendarSetVisibleYearProps extends CalendarSetVisibleYear.Props {
  /**
   * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
   */
  ctx: InnerCalendarSetVisibleYearContext;
}

interface InnerCalendarSetVisibleYearContext {
  setTarget: () => void;
  isDisabled: boolean;
}
