// Stable sentinel value appended to the navigable list when `creatable` is enabled.
const CREATE_ITEM_SYMBOL = Symbol('base-ui.combobox.createItem');

export const COMBOBOX_CREATE_ITEM: any = Object.freeze({ [CREATE_ITEM_SYMBOL]: true });

export function isComboboxCreateItem(item: unknown): boolean {
  return typeof item === 'object' && item !== null && (item as any)[CREATE_ITEM_SYMBOL] === true;
}
