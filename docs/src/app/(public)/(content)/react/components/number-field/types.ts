import { NumberField } from '@base-ui-components/react/number-field';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, NumberField);

export const TypesNumberFieldRoot = types.Root;
export const TypesNumberFieldScrubArea = types.ScrubArea;
export const TypesNumberFieldScrubAreaCursor = types.ScrubAreaCursor;
export const TypesNumberFieldGroup = types.Group;
export const TypesNumberFieldDecrement = types.Decrement;
export const TypesNumberFieldInput = types.Input;
export const TypesNumberFieldIncrement = types.Increment;
