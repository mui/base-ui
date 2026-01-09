import * as React from 'react';
import { createSelectorMemoized, useStore } from '@base-ui/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { selectors } from '../../utils/temporal/field/selectors';
import {
  TemporalFieldState as State,
  TemporalFieldSection,
} from '../../utils/temporal/field/types';
import { TemporalAdapter, TemporalTimezone } from '../../types';

const translations = {
  empty: 'Empty',
  year: 'Year',
  month: 'Month',
  day: 'Day',
  weekDay: 'Week day',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  meridiem: 'Meridiem',
};

const sectionPropsSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  selectors.readOnly,
  selectors.disabled,
  selectors.timezoneToRender,
  selectors.sectionRenderedValue,
  selectors.sectionBoundaries,
  (
    adapter,
    readOnly,
    disabled,
    timezone,
    sectionRenderedValue,
    sectionBoundaries,
    section: TemporalFieldSection,
  ) => {
    const isEditable = !isContainerEditable && !disabled && !readOnly;

    return {
      // Aria attributes
      'aria-readonly': readOnly,
      'aria-valuenow': getSectionValueNow(adapter, section, timezone),
      'aria-valuemin': sectionBoundaries.minimum,
      'aria-valuemax': sectionBoundaries.maximum,
      'aria-valuetext': section.value
        ? getSectionValueText(adapter, section, timezone)
        : translations.empty,
      'aria-label': translations[section.sectionType],
      'aria-disabled': disabled,

      // Other
      tabIndex: !isEditable || isContainerEditable || sectionIndex > 0 ? -1 : 0,
      contentEditable: !isContainerEditable && !disabled && !readOnly,
      role: 'spinbutton',
      // 'data-range-position': (section as FieldRangeSection).dateName || undefined,
      spellCheck: isEditable ? false : undefined,
      // Firefox hydrates this as `'none`' instead of `'off'`. No problems in chromium with both values.
      // For reference https://github.com/mui/mui-x/issues/19012
      autoCapitalize: isEditable ? 'none' : undefined,
      autoCorrect: isEditable ? 'off' : undefined,
      children: sectionRenderedValue,
      inputMode: section.contentType === 'letter' ? 'text' : 'numeric',
    };
  },
);

/**
 * Groups all parts of the date field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/date-field)
 */
export const DateFieldSection = React.forwardRef(function DateFieldSection(
  componentProps: DateFieldSection.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    // Internal props
    section,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const store = useDateFieldRootContext();
  const propsFromState = useStore(store, sectionPropsSelector, section);

  return useRenderElement('div', componentProps, {
    // state,
    ref: forwardedRef,
    props: [propsFromState, elementProps],
    // stateAttributesMapping,
  });
});

function getSectionValueNow(
  adapter: TemporalAdapter,
  section: TemporalFieldSection,
  timezone: TemporalTimezone,
): number | undefined {
  if (!section.value) {
    return undefined;
  }
  switch (section.sectionType) {
    case 'weekDay': {
      if (section.contentType === 'letter') {
        // TODO: improve by resolving the week day number from a letter week day
        return undefined;
      }
      return Number(section.value);
    }
    case 'meridiem': {
      const parsedDate = adapter.parse(
        `01:00 ${section.value}`,
        `${adapter.formats.hours12h}:${adapter.formats.minutesPadded} ${section.format}`,
        timezone,
      );
      if (parsedDate) {
        return adapter.getHours(parsedDate) >= 12 ? 1 : 0;
      }
      return undefined;
    }
    case 'day':
      return section.contentType === 'digit-with-letter'
        ? parseInt(section.value, 10)
        : Number(section.value);
    case 'month': {
      if (section.contentType === 'digit') {
        return Number(section.value);
      }
      const parsedDate = adapter.parse(section.value, section.format, timezone);
      return parsedDate ? adapter.getMonth(parsedDate) + 1 : undefined;
    }
    default:
      return section.contentType !== 'letter' ? Number(section.value) : undefined;
  }
}

function getSectionValueText(
  adapter: TemporalAdapter,
  section: TemporalFieldSection,
  timezone: TemporalTimezone,
): string | undefined {
  if (!section.value) {
    return undefined;
  }
  switch (section.sectionType) {
    case 'month': {
      if (section.contentType === 'digit') {
        const dateWithMonth = adapter.setMonth(adapter.now(timezone), Number(section.value) - 1);
        return adapter.isValid(dateWithMonth)
          ? adapter.format(dateWithMonth, 'monthFullLetter')
          : '';
      }
      const parsedDate = adapter.parse(section.value, section.format, timezone);
      return parsedDate && adapter.isValid(parsedDate)
        ? adapter.format(parsedDate, 'monthFullLetter')
        : undefined;
    }
    case 'day':
      if (section.contentType === 'digit') {
        const dateWithDay = adapter.setDate(
          adapter.startOfYear(adapter.now(timezone)),
          Number(section.value),
        );
        return adapter.isValid(dateWithDay)
          ? adapter.format(dateWithDay, 'dayOfMonthWithLetter')
          : '';
      }
      return section.value;
    case 'weekDay':
      // TODO: improve by providing the label of the week day
      return undefined;
    default:
      return undefined;
  }
}

export interface DateFieldSectionState {}

export interface DateFieldSectionProps extends BaseUIComponentProps<'div', DateFieldSectionState> {
  /**
   * The section to render.
   */
  section: TemporalFieldSection;
}

export namespace DateFieldSection {
  export type Props = DateFieldSectionProps;
  export type State = DateFieldSectionState;
}
