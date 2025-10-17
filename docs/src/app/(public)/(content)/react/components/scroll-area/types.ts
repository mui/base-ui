import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, ScrollArea);

export const TypesScrollAreaRoot = types.Root;
export const TypesScrollAreaViewport = types.Viewport;
export const TypesScrollAreaContent = types.Content;
export const TypesScrollAreaScrollbar = types.Scrollbar;
export const TypesScrollAreaThumb = types.Thumb;
export const TypesScrollAreaCorner = types.Corner;
