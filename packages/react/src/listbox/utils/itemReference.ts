/**
 * An item remembered across changes to the list. It's remembered by its value, so it's found again
 * after items are added or removed around it, and by its position, which tells items that share a
 * value apart.
 */
export interface ItemReference {
  index: number;
  value: any;
}

/** Reads the items a reference points into. */
export interface ItemReferenceSource {
  getValue: (index: number) => any;
  indexOfValue: (value: any) => number;
}

export function createItemReference(source: ItemReferenceSource, index: number): ItemReference {
  return { index, value: source.getValue(index) };
}

/** Where a referenced item is now, or `-1` when it's gone. */
export function resolveItemReference(source: ItemReferenceSource, reference: ItemReference) {
  if (reference.index >= 0 && Object.is(source.getValue(reference.index), reference.value)) {
    return reference.index;
  }
  return source.indexOfValue(reference.value);
}
