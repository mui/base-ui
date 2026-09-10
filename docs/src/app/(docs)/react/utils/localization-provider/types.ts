import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { createTypes } from 'docs/src/utils/createTypes';

export const TypesLocalizationProvider = createTypes(import.meta.url, LocalizationProvider);
