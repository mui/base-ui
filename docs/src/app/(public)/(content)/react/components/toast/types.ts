import { Toast } from '@base-ui-components/react/toast';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Toast);

export const TypesToastProvider = types.Provider;
export const TypesToastViewport = types.Viewport;
export const TypesToastPortal = types.Portal;
export const TypesToastRoot = types.Root;
export const TypesToastContent = types.Content;
export const TypesToastTitle = types.Title;
export const TypesToastDescription = types.Description;
export const TypesToastAction = types.Action;
export const TypesToastClose = types.Close;
