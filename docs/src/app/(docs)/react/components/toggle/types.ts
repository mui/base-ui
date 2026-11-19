import * as Toggle from '@base-ui/react/toggle';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types } = createMultipleTypes(import.meta.url, Toggle);

export const TypesToggle = types;
