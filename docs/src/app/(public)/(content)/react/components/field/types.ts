import { Field } from '@base-ui-components/react/field';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Field);

export const TypesFieldRoot = types.Root;
export const TypesFieldLabel = types.Label;
export const TypesFieldControl = types.Control;
export const TypesFieldDescription = types.Description;
export const TypesFieldItem = types.Item;
export const TypesFieldError = types.Error;
export const TypesFieldValidity = types.Validity;
