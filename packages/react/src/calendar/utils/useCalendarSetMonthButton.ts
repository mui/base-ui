import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { selectors } from '../store';
import { useCalendarMonthButton } from './useCalendarMonthButton';
import { REASONS } from '../../utils/reasons';

interface CalendarSetMonthButtonState {
  disabled: boolean;
}

interface UseCalendarSetMonthButtonParameters {
  direction: 1 | -1;
  ariaLabel: { singular: string; plural: string };
  componentProps: BaseUIComponentProps<'button', CalendarSetMonthButtonState> & NativeButtonProps;
  forwardedRef: React.ForwardedRef<HTMLButtonElement>;
}

export function useCalendarSetMonthButton(params: UseCalendarSetMonthButtonParameters) {
  const { direction, ariaLabel, componentProps, forwardedRef } = params;
  const {
    className,
    render,
    nativeButton,
    disabled: disabledProp,
    ...elementProps
  } = componentProps;

  const store = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const monthPageSize = useStore(store, selectors.monthPageSize);
  const visibleDate = useStore(store, selectors.visibleDate);

  const targetDate = React.useMemo(
    () => adapter.addMonths(visibleDate, direction * monthPageSize),
    [visibleDate, monthPageSize, adapter, direction],
  );

  const isDisabled = useStore(store, selectors.isSetMonthButtonDisabled, targetDate, disabledProp);

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
    focusableWhenDisabled: true,
  });

  const { pointerHandlers, autoChangeButtonRef, shouldSkipClick } = useCalendarMonthButton({
    direction,
    disabled: isDisabled,
    disabledProp,
    store,
    adapter,
    monthPageSize,
  });

  const state: CalendarSetMonthButtonState = React.useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, autoChangeButtonRef, forwardedRef],
    props: [
      {
        tabIndex: 0,
        'aria-label': monthPageSize > 1 ? ariaLabel.plural : ariaLabel.singular,
        onClick(event: React.MouseEvent<HTMLButtonElement>) {
          if (isDisabled || shouldSkipClick(event)) {
            return;
          }
          store.setVisibleDate(
            targetDate,
            event.nativeEvent,
            event.currentTarget as HTMLElement,
            REASONS.monthChange,
          );
        },
        ...pointerHandlers,
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
}
