import { OTPFieldPreview } from '@base-ui/react/otp-field';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, OTPFieldPreview);

export const TypesOTPField = types;
export const TypesOTPFieldAdditional = AdditionalTypes;
