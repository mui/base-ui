import { Toolbar } from '@base-ui-components/react/toolbar';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Toolbar);

export const TypesToolbarRoot = types.Root;
export const TypesToolbarButton = types.Button;
export const TypesToolbarLink = types.Link;
export const TypesToolbarInput = types.Input;
export const TypesToolbarGroup = types.Group;
export const TypesToolbarSeparator = types.Separator;
