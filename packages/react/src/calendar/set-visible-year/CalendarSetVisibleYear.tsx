'use client';
import * as React from 'react';
import { getFirstEnabledYear, getLastEnabledYear } from '../utils/date-helpers';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useNullableSharedCalendarYearCollectionContext } from '../utils/SharedCalendarYearCollectionContext';
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
      tabIndex: ctx.isTabbable ? 0 : -1,
    }),
    [ctx.isDisabled, ctx.isTabbable, ctx.setTarget],
  );

  const state: CalendarSetVisibleYear.State = React.useMemo(
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

const MemoizedInnerCalendarSetVisibleYear = React.memo(InnerCalendarSetVisibleYear);

const CalendarSetVisibleYear = React.forwardRef(function CalendarSetVisibleYear(
  props: CalendarSetVisibleYear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const sharedRootContext = useSharedCalendarRootContext();
  const sharedRootVisibleDateContext = useSharedCalendarRootVisibleDateContext();
  const sharedYearListOrGridContext = useNullableSharedCalendarYearCollectionContext();
  const adapter = useTemporalAdapter();
  const { ref: listItemRef } = useCompositeListItem();
  const ref = useForkRef(forwardedRef, listItemRef);

  const targetDate = React.useMemo(() => {
    if (props.target === 'previous') {
      return adapter.addYears(sharedRootVisibleDateContext.visibleDate, -1);
    }

    if (props.target === 'next') {
      return adapter.addYears(sharedRootVisibleDateContext.visibleDate, 1);
    }

    return adapter.setYear(sharedRootVisibleDateContext.visibleDate, adapter.getYear(props.target));
  }, [sharedRootVisibleDateContext.visibleDate, adapter, props.target]);

  const isDisabled = React.useMemo(() => {
    if (sharedRootContext.disabled) {
      return true;
    }

    const isMovingBefore = adapter.isBefore(targetDate, sharedRootVisibleDateContext.visibleDate);

    // All the years before the visible ones are fully disabled, we skip the navigation.
    if (isMovingBefore) {
      return adapter.isAfter(
        getFirstEnabledYear(adapter, sharedRootContext.dateValidationProps),
        targetDate,
      );
    }

    // All the years after the visible ones are fully disabled, we skip the navigation.
    return adapter.isBefore(
      getLastEnabledYear(adapter, sharedRootContext.dateValidationProps),
      targetDate,
    );
  }, [
    sharedRootContext.disabled,
    sharedRootContext.dateValidationProps,
    sharedRootVisibleDateContext.visibleDate,
    targetDate,
    adapter,
  ]);

  const canCellBeTabbed = sharedYearListOrGridContext?.canCellBeTabbed;
  const isTabbable = React.useMemo(() => {
    // If the button is not inside a year list or grid, then it is always tabbable.
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

  const ctx = React.useMemo<InnerCalendarSetVisibleYearContext>(
    () => ({
      setTarget,
      isDisabled,
      isTabbable,
      direction,
    }),
    [setTarget, isDisabled, isTabbable, direction],
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
  isTabbable: boolean;
  direction: 'before' | 'after';
}

export { CalendarSetVisibleYear };
