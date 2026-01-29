import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalFieldState as State } from './types';
import { getTimezoneToRender } from './utils';

export const selectors = {
  timezoneToRender: createSelectorMemoized(
    (state: State) => state.adapter,
    (state: State) => state.manager,
    (state: State) => state.value,
    (state: State) => state.referenceDateProp,
    (state: State) => state.timezoneProp,
    getTimezoneToRender,
  ),
  required: createSelector((state: State) => state.required),
  disabled: createSelector(
    (state: State) => state.fieldContext?.state.disabled || state.disabledProp,
  ),
  readOnly: createSelector((state: State) => state.readOnly),
  editable: createSelector(
    (state: State) =>
      !(state.fieldContext?.state.disabled || state.disabledProp) && !state.readOnly,
  ),
  invalid: createSelector((state: State) => state.fieldContext?.invalid ?? false),
  name: createSelector((state: State) => state.fieldContext?.name ?? state.nameProp),
  id: createSelector((state: State) => state.id),
  adapter: createSelector((state: State) => state.adapter),
  manager: createSelector((state: State) => state.manager),
  config: createSelector((state: State) => state.config),
  validationProps: createSelector((state: State) => state.validationProps),
  fieldContext: createSelector((state: State) => state.fieldContext),
  step: createSelector((state: State) => state.step),
  inputRef: createSelector((state: State) => state.inputRef),
};
