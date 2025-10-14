export * as Autocomplete from './index.parts';

export type * from './root/AutocompleteRoot';
export type * from './value/AutocompleteValue';

export type {
  ComboboxTriggerProps as AutocompleteTriggerProps,
  ComboboxTriggerState as AutocompleteTriggerState,
} from '../combobox/trigger/ComboboxTrigger';
export type {
  ComboboxInputProps as AutocompleteInputProps,
  ComboboxInputState as AutocompleteInputState,
} from '../combobox/input/ComboboxInput';
export type {
  ComboboxPopupProps as AutocompletePopupProps,
  ComboboxPopupState as AutocompletePopupState,
} from '../combobox/popup/ComboboxPopup';
export type {
  ComboboxPositionerProps as AutocompletePositionerProps,
  ComboboxPositionerState as AutocompletePositionerState,
} from '../combobox/positioner/ComboboxPositioner';
export type {
  ComboboxListProps as AutocompleteListProps,
  ComboboxListState as AutocompleteListState,
} from '../combobox/list/ComboboxList';
export type {
  ComboboxItemProps as AutocompleteItemProps,
  ComboboxItemState as AutocompleteItemState,
} from '../combobox/item/ComboboxItem';
export type {
  ComboboxArrowProps as AutocompleteArrowProps,
  ComboboxArrowState as AutocompleteArrowState,
} from '../combobox/arrow/ComboboxArrow';
export type {
  ComboboxBackdropProps as AutocompleteBackdropProps,
  ComboboxBackdropState as AutocompleteBackdropState,
} from '../combobox/backdrop/ComboboxBackdrop';
export type { ComboboxPortalProps as AutocompletePortalProps } from '../combobox/portal/ComboboxPortal';
export type {
  ComboboxGroupProps as AutocompleteGroupProps,
  ComboboxGroupState as AutocompleteGroupState,
} from '../combobox/group/ComboboxGroup';
export type {
  ComboboxGroupLabelProps as AutocompleteGroupLabelProps,
  ComboboxGroupLabelState as AutocompleteGroupLabelState,
} from '../combobox/group-label/ComboboxGroupLabel';
export type {
  ComboboxEmptyProps as AutocompleteEmptyProps,
  ComboboxEmptyState as AutocompleteEmptyState,
} from '../combobox/empty/ComboboxEmpty';
export type {
  ComboboxStatusProps as AutocompleteStatusProps,
  ComboboxStatusState as AutocompleteStatusState,
} from '../combobox/status/ComboboxStatus';
export type { ComboboxCollectionProps as AutocompleteCollectionProps } from '../combobox/collection/ComboboxCollection';

export type {
  Filter as AutocompleteFilter,
  UseFilterOptions as AutocompleteFilterOptions,
} from '../combobox/root/utils/useFilter';
