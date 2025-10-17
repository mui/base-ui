'use client'; // TODO: it seems that Popover can't even be imported in a server component

import { Popover } from '@base-ui-components/react/popover';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Popover);

export const TypesPopoverRoot = types.Root;
export const TypesPopoverTrigger = types.Trigger;
export const TypesPopoverBackdrop = types.Backdrop;
export const TypesPopoverPortal = types.Portal;
export const TypesPopoverPositioner = types.Positioner;
export const TypesPopoverPopup = types.Popup;
export const TypesPopoverArrow = types.Arrow;
export const TypesPopoverTitle = types.Title;
export const TypesPopoverDescription = types.Description;
export const TypesPopoverClose = types.Close;
export const TypesPopoverViewport = types.Viewport;
