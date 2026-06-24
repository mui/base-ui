import { PasswordToggleFieldPreview } from '@base-ui/react/password-toggle-field';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, PasswordToggleFieldPreview);

export const TypesPasswordToggleField = types;
export const TypesPasswordToggleFieldAdditional = AdditionalTypes;
