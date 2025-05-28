'use client';
import * as React from 'react';
import { getFirstEnabledMonth, getLastEnabledMonth } from '../utils/date-helpers';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useNullableSharedCalendarMonthCollectionContext } from '../utils/SharedCalendarMonthCollectionContext';
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

  const props = React.useMemo(
    () => ({
      type: 'button' as const,
      disabled: ctx.isDisabled,
      onClick: ctx.setTarget,
      tabIndex: ctx.isTabbable ? 0 : -1,
    }),
    [ctx.isDisabled, ctx.isTabbable, ctx.setTarget],
  );

  const state: CalendarSetVisibleMonth.State = React.useMemo(
    () => ({
      direction: ctx.direction,
    }),
    [ctx.direction],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: forwardedRef,
    props: [props, elementProps],
  });

  return element;
});

const MemoizedInnerCalendarSetVisibleMonth = React.memo(InnerCalendarSetVisibleMonth);

const CalendarSetVisibleMonth = React.forwardRef(function CalendarSetVisibleMonth(
  props: CalendarSetVisibleMonth.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const sharedRootVisibleDateContext = useSharedCalendarRootVisibleDateContext();
  const sharedRootContext = useSharedCalendarRootContext();
  const sharedMonthListOrGridContext = useNullableSharedCalendarMonthCollectionContext();
  const adapter = useTemporalAdapter();
  const { ref: listItemRef } = useCompositeListItem();
  const ref = useForkRef(forwardedRef, listItemRef);

  const targetDate = React.useMemo(() => {
    if (props.target === 'previous') {
      return adapter.addMonths(
        sharedRootVisibleDateContext.visibleDate,
        -sharedRootContext.monthPageSize,
      );
    }

    if (props.target === 'next') {
      return adapter.addMonths(
        sharedRootVisibleDateContext.visibleDate,
        sharedRootContext.monthPageSize,
      );
    }

    return adapter.setYear(
      adapter.setMonth(sharedRootVisibleDateContext.visibleDate, adapter.getMonth(props.target)),
      adapter.getYear(props.target),
    );
  }, [
    sharedRootVisibleDateContext.visibleDate,
    sharedRootContext.monthPageSize,
    adapter,
    props.target,
  ]);

  const isDisabled = React.useMemo(() => {
    if (sharedRootContext.disabled) {
      return true;
    }

    // TODO: Check if the logic below works correctly when multiple months are rendered at once.
    const isMovingBefore = adapter.isBefore(targetDate, sharedRootVisibleDateContext.visibleDate);

    // All the months before the visible ones are fully disabled, we skip the navigation.
    if (isMovingBefore) {
      return adapter.isAfter(
        getFirstEnabledMonth(adapter, sharedRootContext.dateValidationProps),
        targetDate,
      );
    }

    // All the months after the visible ones are fully disabled, we skip the navigation.
    return adapter.isBefore(
      getLastEnabledMonth(adapter, sharedRootContext.dateValidationProps),
      targetDate,
    );
  }, [
    sharedRootContext.disabled,
    sharedRootContext.dateValidationProps,
    sharedRootVisibleDateContext.visibleDate,
    targetDate,
    adapter,
  ]);

  const canCellBeTabbed = sharedMonthListOrGridContext?.canCellBeTabbed;
  const isTabbable = React.useMemo(() => {
    // If the button is not inside a month list or grid, then it is always tabbable.
    if (canCellBeTabbed == null) {
      return true;
    }

    return canCellBeTabbed(targetDate);
  }, [canCellBeTabbed, targetDate]);

  const setTarget = useEventCallback(() => {
    if (isDisabled) {
      return;
    }
    sharedRootContext.setVisibleDate(targetDate, false);
  });

  const direction = React.useMemo(
    () =>
      adapter.isBefore(targetDate, sharedRootVisibleDateContext.visibleDate) ? 'before' : 'after',
    [targetDate, sharedRootVisibleDateContext.visibleDate, adapter],
  );

  const ctx = React.useMemo<InnerCalendarSetVisibleMonthContext>(
    () => ({
      setTarget,
      isDisabled,
      isTabbable,
      direction,
    }),
    [setTarget, isDisabled, isTabbable, direction],
  );

  return <MemoizedInnerCalendarSetVisibleMonth ref={ref} {...props} ctx={ctx} />;
});

export namespace CalendarSetVisibleMonth {
  export interface State {
    /**
     * The direction of the target month relative to the current visible month.
     * - "before" if the target month is before the current visible month.
     * - "after" if the target month is after the current visible month.
     */
    direction: 'before' | 'after';
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
  isTabbable: boolean;
  direction: 'before' | 'after';
}

export { CalendarSetVisibleMonth };
