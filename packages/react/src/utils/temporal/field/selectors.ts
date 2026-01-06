import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalFieldSection, TemporalFieldState as State } from './types';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../../types';
import { getTimezoneToRender } from './utils';

const timezoneToRenderSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  (state: State) => state.manager,
  (state: State) => state.value,
  (state: State) => state.referenceDateProp,
  (state: State) => state.timezoneProp,
  getTimezoneToRender,
);

export const selectors = {
  timezoneToRender: timezoneToRenderSelector,
  selectedSections: createSelector((state: State) => state.selectedSections),
  isSelectingAllSections: createSelector(
    (state: State) => state.selectedSections,
    (selectedSections) => selectedSections === 'all',
  ),
  activeSection: createSelectorMemoized(
    (state: State) => state.valueManager,
    (state: State) => (state.selectedSections === 'all' ? 0 : state.selectedSections),
    (state: State) => state.sections,
    (state: State) => state.value,
    (valueManager, index, sections, value) => {
      if (index == null) {
        return null;
      }

      const section = sections[index];

      return {
        index,
        section,
        date: valueManager.getDateFromSection(value, section),
        update: (newSectionValue: string) => {
          const newSections = [...sections];
          newSections[index] = {
            ...newSections[index],
            value: newSectionValue,
            modified: true,
          };

          return newSections;
        },
      };
    },
  ) as <TValue extends TemporalSupportedValue>(
    state: State<TValue>,
  ) => {
    index: number;
    section: TemporalFieldSection<TValue>;
    date: TemporalSupportedObject | null;
    update: (newSectionValue: string) => TemporalFieldSection<TValue>[];
  } | null,
};
