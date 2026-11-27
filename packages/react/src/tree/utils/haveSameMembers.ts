import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type { TreeItemId } from '../store/types';

/**
 * Whether two lists of unique ids hold the same ids, whatever their order. Anything
 * other than two arrays, such as a single selected id, only matches itself.
 */
export function haveSameMembers(
  a: readonly TreeItemId[] | TreeItemId | null | undefined,
  b: readonly TreeItemId[] | TreeItemId | null | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  if (areArraysEqual(a, b)) {
    return true;
  }
  const members = new Set(a);
  return b.every((itemId) => members.has(itemId));
}
