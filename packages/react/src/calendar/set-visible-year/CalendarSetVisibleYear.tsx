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

  const props = React.useMemo(
    () => ({
      type: 'button' as const,
      disabled: ctx.isDisabled,
      onClick: ctx.setTarget,
      tabIndex: 0,
    }),
    [ctx.isDisabled, ctx.setTarget],
  );

  const state: CalendarSetVisibleYear.State = React.useMemo(
    () => ({
      disabled: ctx.isDisabled,
      direction: ctx.direction,
    }),
    [ctx.direction, ctx.isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: forwardedRef,
    props: [props, elementProps],
  });

  return element;
});

const MemoizedInnerCalendarSetVisibleYear = React.memo(InnerCalendarSetVisibleYear);

const CalendarSetVisibleYear = React.forwardRef(function CalendarSetVisibleYear(
  props: CalendarSetVisibleYear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { disabled, dateValidationProps, setVisibleDate } = useSharedCalendarRootContext();
  const { visibleDate } = useSharedCalendarRootVisibleDateContext();
  const adapter = useTemporalAdapter();
  const { ref: listItemRef } = useCompositeListItem();
  const ref = useForkRef(forwardedRef, listItemRef);

  const { targetDate, direction } = React.useMemo<{
    targetDate: TemporalSupportedObject;
    direction: 'before' | 'after';
  }>(() => {
    if (props.target === 'previous') {
      return { targetDate: adapter.addYears(visibleDate, -1), direction: 'before' };
    }

    if (props.target === 'next') {
      return { targetDate: adapter.addYears(visibleDate, 1), direction: 'after' };
    }

    const tempTargetDate = adapter.setYear(visibleDate, adapter.getYear(props.target));
    return {
      targetDate: tempTargetDate,
      direction: adapter.isBefore(tempTargetDate, visibleDate) ? 'before' : 'after',
    };
  }, [visibleDate, adapter, props.target]);

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
    () => ({ setTarget, isDisabled, direction }),
    [setTarget, isDisabled, direction],
  );

  return <MemoizedInnerCalendarSetVisibleYear ref={ref} {...props} ctx={ctx} />;
});

export namespace CalendarSetVisibleYear {
  export interface State {
    /**
     * The direction of the target year relative to the current visible year.
     * - "before" if the target year is before the current visible year.
     * - "after" if the target year is after the current visible year.
     */
    direction: 'before' | 'after';
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
  direction: 'before' | 'after';
}

export { CalendarSetVisibleYear };
