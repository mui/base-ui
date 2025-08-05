'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useStore } from '@base-ui-components/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CalendarDayButtonDataAttributes } from './CalendarDayButtonDataAttributes';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useButton } from '../../use-button';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useSharedCalendarDayGridBodyContext } from '../day-grid-body/SharedCalendarDayGridBodyContext';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useCalendarDayGridCellContext } from '../day-grid-cell/SharedCalendarDayGridCellContext';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { selectors } from '../store';

const customStyleHookMapping: CustomStyleHookMapping<CalendarDayButton.State> = {
  selected(value) {
    return value ? { [CalendarDayButtonDataAttributes.selected]: '' } : null;
  },
  disabled(value) {
    return value ? { [CalendarDayButtonDataAttributes.disabled]: '' } : null;
  },
  unavailable(value) {
    return value ? { [CalendarDayButtonDataAttributes.unavailable]: '' } : null;
  },
  current(value) {
    return value ? { [CalendarDayButtonDataAttributes.current]: '' } : null;
  },
  outsideMonth(value) {
    return value ? { [CalendarDayButtonDataAttributes.outsideMonth]: '' } : null;
  },
};

const InnerCalendarDayButton = React.forwardRef(function InnerCalendarDayButton(
  componentProps: CalendarDayButton.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const adapter = useTemporalAdapter();

  const {
    className,
    render,
    nativeButton,
    format = adapter.formats.dayOfMonth,
    disabled,
    ...elementProps
  } = componentProps;

  const { store, selectDate } = useSharedCalendarRootContext();
  const { canCellBeTabbed } = useSharedCalendarDayGridBodyContext();
  const {
    isDisabled: isCellDisabled,
    isUnavailable,
    isOutsideCurrentMonth,
    value,
  } = useCalendarDayGridCellContext();
  const isSelected = useStore(store, selectors.isDayButtonSelected, value);

  const isCurrent = React.useMemo(
    () => adapter.isSameDay(value, adapter.now(adapter.getTimezone(value))),
    [adapter, value],
  );

  const isTabbable = React.useMemo(() => canCellBeTabbed(value), [canCellBeTabbed, value]);

  const formattedDate = React.useMemo(
    () => adapter.format(value, 'localizedDateWithFullMonthAndWeekDay'),
    [adapter, value],
  );

  const isDisabled = disabled ?? isCellDisabled;

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
  });

  const formattedValue = React.useMemo(
    () => adapter.formatByString(value, format),
    [adapter, value, format],
  );

  const onClick = useEventCallback(() => {
    if (isUnavailable) {
      return;
    }
    selectDate(value);
  });

  const itemMetadata = React.useMemo(
    () => ({ focusableWhenDisabled: !isDisabled && !isOutsideCurrentMonth }),
    [isDisabled, isOutsideCurrentMonth],
  );

  const props: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    'aria-label': formattedDate,
    'aria-selected': isSelected ? true : undefined,
    'aria-current': isCurrent ? 'date' : undefined,
    'aria-disabled': isDisabled || isOutsideCurrentMonth || isUnavailable ? true : undefined,
    children: formattedValue,
    tabIndex: isTabbable ? 0 : -1,
    onClick,
  };

  const state: CalendarDayButton.State = React.useMemo(
    () => ({
      selected: isSelected,
      disabled: isDisabled,
      unavailable: isUnavailable,
      current: isCurrent,
      outsideMonth: isOutsideCurrentMonth,
    }),
    [isSelected, isDisabled, isUnavailable, isCurrent, isOutsideCurrentMonth],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [props, elementProps, getButtonProps],
    customStyleHookMapping,
  });

  return <CompositeItem metadata={itemMetadata} render={element} />;
});

/**
 * An individual interactive day button in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayButton = React.memo(InnerCalendarDayButton);

export namespace CalendarDayButton {
  export interface State {
    /**
     * Whether the day is selected.
     */
    selected: boolean;
    /**
     * Whether the day is disabled.
     */
    disabled: boolean;
    /**
     * Whether the day is not available.
     */
    unavailable: boolean;
    /**
     * Whether the day contains the current date.
     */
    current: boolean;
    /**
     * Whether the day is outside the month rendered by the day grid wrapping it.
     */
    outsideMonth: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'value'> {
    /**
     * The format used to display the day.
     * @default adapter.formats.dayOfMonth
     */
    format?: string;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
