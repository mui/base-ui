import { PreviewCard } from '@base-ui-components/react/preview-card';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, PreviewCard);

export const TypesPreviewCardRoot = types.Root;
export const TypesPreviewCardTrigger = types.Trigger;
export const TypesPreviewCardPortal = types.Portal;
export const TypesPreviewCardBackdrop = types.Backdrop;
export const TypesPreviewCardPositioner = types.Positioner;
export const TypesPreviewCardPopup = types.Popup;
export const TypesPreviewCardArrow = types.Arrow;
