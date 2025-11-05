import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Autocomplete);

export const TypesAutocompleteRoot = types.Root;
export const TypesAutocompleteValue = types.Value;
export const TypesAutocompleteInput = types.Input;
export const TypesAutocompleteTrigger = types.Trigger;
export const TypesAutocompleteIcon = types.Icon;
export const TypesAutocompleteClear = types.Clear;
export const TypesAutocompleteList = types.List;
export const TypesAutocompletePortal = types.Portal;
export const TypesAutocompleteBackdrop = types.Backdrop;
export const TypesAutocompletePositioner = types.Positioner;
export const TypesAutocompletePopup = types.Popup;
export const TypesAutocompleteArrow = types.Arrow;
export const TypesAutocompleteStatus = types.Status;
export const TypesAutocompleteEmpty = types.Empty;
export const TypesAutocompleteCollection = types.Collection;
export const TypesAutocompleteRow = types.Row;
export const TypesAutocompleteItem = types.Item;
export const TypesAutocompleteGroup = types.Group;
export const TypesAutocompleteGroupLabel = types.GroupLabel;
export const TypesAutocompleteSeparator = types.Separator;
