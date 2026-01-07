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

const sectionManagerSelector = createSelectorMemoized(
  (state: State) => state.valueManager,
  (state: State) => state.sections,
  (state: State) => state.value,
  (valueManager, sections, value, sectionIndex: number) => {
    const section = sections[sectionIndex];

    return {
      ...section,
      index: sectionIndex,
      date: valueManager.getDateFromSection(value, section),
      update: (newSectionValue: string) => {
        const newSections = [...sections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          value: newSectionValue,
          modified: true,
        };

        return newSections;
      },
    };
  },
) as <TValue extends TemporalSupportedValue>(
  state: State<TValue>,
  sectionIndex: number,
) => TemporalFieldSectionManager<TValue> | null;

export const selectors = {
  timezoneToRender: timezoneToRenderSelector,
  sections: createSelector((state: State) => state.sections) as <
    TValue extends TemporalSupportedValue,
  >(
    state: State<TValue>,
  ) => TemporalFieldSection<TValue>[],
  selectedSections: createSelector((state: State) => state.selectedSections),
  isSelectingAllSections: createSelector(
    (state: State) => state.selectedSections,
    (selectedSections) => selectedSections === 'all',
  ),
  section: sectionManagerSelector,
  activeSection: createSelectorMemoized(
    (state: State) => state,
    (state: State) => (state.selectedSections === 'all' ? 0 : state.selectedSections),
    (state, sectionIndex) => {
      if (sectionIndex == null) {
        return null;
      }

      return sectionManagerSelector(state, sectionIndex);
    },
  ) as <TValue extends TemporalSupportedValue>(
    state: State<TValue>,
  ) => TemporalFieldSectionManager<TValue> | null,
};

type TemporalFieldSectionManager<TValue extends TemporalSupportedValue> =
  TemporalFieldSection<TValue> & {
    index: number;
    date: TemporalSupportedObject | null;
    update: (newSectionValue: string) => TemporalFieldSection<TValue>[];
  };
