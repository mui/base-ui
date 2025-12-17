import { Avatar } from '@base-ui-components/react/avatar';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Avatar);

export const TypesAvatarRoot = types.Root;
export const TypesAvatarImage = types.Image;
export const TypesAvatarFallback = types.Fallback;
