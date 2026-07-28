type ElementFromPointRoot = Node & Partial<Pick<Document, 'elementFromPoint'>>;

export function getElementAtPoint(
  root: ElementFromPointRoot | null | undefined,
  x: number,
  y: number,
) {
  return typeof root?.elementFromPoint === 'function' ? root.elementFromPoint(x, y) : null;
}
