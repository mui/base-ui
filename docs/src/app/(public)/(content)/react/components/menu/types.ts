import { Menu } from '@base-ui-components/react/menu';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Menu);

export const TypesMenuRoot = types.Root;
export const TypesMenuTrigger = types.Trigger;
export const TypesMenuPortal = types.Portal;
export const TypesMenuBackdrop = types.Backdrop;
export const TypesMenuPositioner = types.Positioner;
export const TypesMenuPopup = types.Popup;
export const TypesMenuArrow = types.Arrow;
export const TypesMenuItem = types.Item;
export const TypesMenuSubmenuRoot = types.SubmenuRoot;
export const TypesMenuSubmenuTrigger = types.SubmenuTrigger;
export const TypesMenuGroup = types.Group;
export const TypesMenuGroupLabel = types.GroupLabel;
export const TypesMenuRadioGroup = types.RadioGroup;
export const TypesMenuRadioItem = types.RadioItem;
export const TypesMenuRadioItemIndicator = types.RadioItemIndicator;
export const TypesMenuCheckboxItem = types.CheckboxItem;
export const TypesMenuCheckboxItemIndicator = types.CheckboxItemIndicator;
export const TypesMenuSeparator = types.Separator;
