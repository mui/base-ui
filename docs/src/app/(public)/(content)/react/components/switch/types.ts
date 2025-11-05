import { Switch } from '@base-ui-components/react/switch';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Switch);

export const TypesSwitchRoot = types.Root;
export const TypesSwitchThumb = types.Thumb;
