import { Dropzone } from '@base-ui/react/dropzone';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Dropzone);

export const TypesDropzone = types;
export const TypesDropzoneAdditional = AdditionalTypes;
