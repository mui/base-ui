import { ContextMenu } from '@base-ui/react/context-menu';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, ContextMenu);

export const TypesContextMenuRoot = types.Root;
export const TypesContextMenuTrigger = types.Trigger;
export const TypesContextMenuPortal = types.Portal;
export const TypesContextMenuBackdrop = types.Backdrop;
export const TypesContextMenuPositioner = types.Positioner;
export const TypesContextMenuPopup = types.Popup;
export const TypesContextMenuArrow = types.Arrow;
export const TypesContextMenuItem = types.Item;
export const TypesContextMenuSubmenuRoot = types.SubmenuRoot;
export const TypesContextMenuSubmenuTrigger = types.SubmenuTrigger;
export const TypesContextMenuGroup = types.Group;
export const TypesContextMenuGroupLabel = types.GroupLabel;
export const TypesContextMenuRadioGroup = types.RadioGroup;
export const TypesContextMenuRadioItem = types.RadioItem;
export const TypesContextMenuRadioItemIndicator = types.RadioItemIndicator;
export const TypesContextMenuCheckboxItem = types.CheckboxItem;
export const TypesContextMenuCheckboxItemIndicator = types.CheckboxItemIndicator;
export const TypesContextMenuSeparator = types.Separator;
