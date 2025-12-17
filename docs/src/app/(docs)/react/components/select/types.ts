import { Select } from '@base-ui-components/react/select';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Select);

export const TypesSelectRoot = types.Root;
export const TypesSelectTrigger = types.Trigger;
export const TypesSelectValue = types.Value;
export const TypesSelectIcon = types.Icon;
export const TypesSelectBackdrop = types.Backdrop;
export const TypesSelectPortal = types.Portal;
export const TypesSelectPositioner = types.Positioner;
export const TypesSelectPopup = types.Popup;
export const TypesSelectList = types.List;
export const TypesSelectArrow = types.Arrow;
export const TypesSelectItem = types.Item;
export const TypesSelectItemText = types.ItemText;
export const TypesSelectItemIndicator = types.ItemIndicator;
export const TypesSelectGroup = types.Group;
export const TypesSelectGroupLabel = types.GroupLabel;
export const TypesSelectScrollUpArrow = types.ScrollUpArrow;
export const TypesSelectScrollDownArrow = types.ScrollDownArrow;
export const TypesSelectSeparator = types.Separator;
