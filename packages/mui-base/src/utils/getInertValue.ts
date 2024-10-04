import { isReactVersionAtLeast } from './reactVersion';

/**
 * Return the inert attribute taking into consideration the React version.
 * React 19 changed the inert attribute from a string to a boolean.
 */
export function getInertValue(value: boolean): any | undefined {
  if (!value) {
    return undefined;
  }

  return isReactVersionAtLeast(19) ? true : 'true';
}
