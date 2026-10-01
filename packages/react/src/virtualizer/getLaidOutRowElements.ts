/**
 * The row elements laid out under the given parent — the render zone while windowing, the
 * scroll element otherwise — in DOM order.
 *
 * Rows are the parent's direct children in a flat list, and the children of one group wrapper
 * per group in a grouped one; both shapes are walked here so no caller has to know which it is
 * looking at. The walk stops at rows and descends one level into anything else, never
 * further: an item renderer may mount a virtualizer of its own, or elements carrying a row index
 * attribute for its own purposes, and neither may be measured as one of this list's rows.
 *
 * Rows the zone mounts but does not lay out are left out — the retained focus row, which is
 * positioned out of layout, and a retained group header, which is hidden — since a rectangle
 * read from either describes nothing on screen.
 */
export function getLaidOutRowElements(rowsParent: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];

  const collect = (element: HTMLElement) => {
    if (element.hidden || element.style.position === 'absolute') {
      return;
    }
    elements.push(element);
  };

  for (let index = 0; index < rowsParent.children.length; index += 1) {
    const child = rowsParent.children[index] as HTMLElement;

    if (isRowElement(child)) {
      collect(child);
      continue;
    }

    for (let rowIndex = 0; rowIndex < child.children.length; rowIndex += 1) {
      const row = child.children[rowIndex] as HTMLElement;
      if (isRowElement(row)) {
        collect(row);
      }
    }
  }

  return elements;
}

function isRowElement(element: HTMLElement) {
  return element.dataset.rowIndex !== undefined;
}
