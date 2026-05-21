import { Fullscreen } from '@base-ui/react/fullscreen';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Fullscreen);

export const TypesFullscreen = types;
export const TypesFullscreenAdditional = AdditionalTypes;
