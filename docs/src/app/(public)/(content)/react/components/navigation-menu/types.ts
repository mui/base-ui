import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, NavigationMenu);

export const TypesNavigationMenuRoot = types.Root;
export const TypesNavigationMenuList = types.List;
export const TypesNavigationMenuItem = types.Item;
export const TypesNavigationMenuTrigger = types.Trigger;
export const TypesNavigationMenuIcon = types.Icon;
export const TypesNavigationMenuContent = types.Content;
export const TypesNavigationMenuLink = types.Link;
export const TypesNavigationMenuBackdrop = types.Backdrop;
export const TypesNavigationMenuPortal = types.Portal;
export const TypesNavigationMenuPositioner = types.Positioner;
export const TypesNavigationMenuPopup = types.Popup;
export const TypesNavigationMenuViewport = types.Viewport;
export const TypesNavigationMenuArrow = types.Arrow;
