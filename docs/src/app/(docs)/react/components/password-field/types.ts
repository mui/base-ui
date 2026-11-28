import { PasswordFieldPreview } from '@base-ui/react/password-field';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, PasswordFieldPreview);

export const TypesPasswordField = types;
export const TypesPasswordFieldAdditional = AdditionalTypes;
