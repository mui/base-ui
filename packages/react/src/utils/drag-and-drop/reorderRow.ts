/**
 * Brand for a collection's per-item drop target.
 *
 * The keyboard collision layer aims the virtual cursor differently at a reorder
 * row — which reads its before/after insertion side from where the cursor sits
 * within it — than at a plain drop zone. It needs to tell the two apart without
 * importing the collection layer above it, and a public `payload` field would
 * let any consumer object claim the private reorder semantics by coincidence.
 *
 * `Symbol.for` (like `sharedState`'s root key) so a doubly-bundled engine agrees
 * on one brand; the key is not part of the public API.
 */
const REORDER_ROW: unique symbol = Symbol.for('@base-ui/react/drag-and-drop/reorder-row');

export { REORDER_ROW };

/** The brand, as it is spread onto a per-item drop target's payload. */
export interface ReorderRowBrand {
  readonly [REORDER_ROW]: true;
}

export const reorderRowBrand: ReorderRowBrand = { [REORDER_ROW]: true };

/** Whether a resolved drop target's payload carries the reorder-row brand. */
export function isReorderRowPayload(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as Partial<ReorderRowBrand>)[REORDER_ROW] === true
  );
}
