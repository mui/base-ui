import { CheckboxGroup, CheckboxGroupPaintSelectionProvider } from '@base-ui/react/checkbox-group';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types } = createMultipleTypes(import.meta.url, {
  CheckboxGroup,
  CheckboxGroupPaintSelectionProvider,
});

export const TypesCheckboxGroup = types;
