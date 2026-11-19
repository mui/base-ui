import { Toggle, ToggleIndicator } from '@base-ui/react/toggle';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types } = createMultipleTypes(import.meta.url, {
  Toggle,
  ToggleIndicator,
});

export const TypesToggle = types;
