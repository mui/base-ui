/**
 * Derives an item ID in the popup's `aria-activedescendant` namespace. React 17 resolves
 * generated IDs in an effect, so leave the item ID unset until the popup ID exists.
 */
export function getMenuItemId(
  id: string | undefined,
  floatingId: string | undefined,
  index: number,
) {
  return id ?? (floatingId == null ? undefined : `${floatingId}-${index}`);
}
