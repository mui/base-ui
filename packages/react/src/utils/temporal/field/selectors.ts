import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalFieldState as State } from './types';
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
  disabled: createSelector((state: State) => state.disabled),
  readOnly: createSelector((state: State) => state.readOnly),
};
