/**
 * Hidden "how to keyboard-drag" instructions nodes.
 *
 * One node per distinct instruction string (per owner document), created lazily
 * and referenced by every draggable handle that resolves to that exact text via
 * `aria-describedby`, so a screen reader reads the instructions when the handle
 * is focused. Visually hidden (present in the accessibility tree).
 *
 * Keying by text — rather than sharing a single node — keeps two draggables with
 * different instructions (e.g. different languages, or custom strings) pointing
 * at their own node instead of clobbering a shared one (last writer wins).
 */

import { ownerDocument } from '@base-ui/utils/owner';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { getSharedSlot } from '../sharedState';

const INSTRUCTIONS_ID_PREFIX = 'base-ui-dnd-keyboard-instructions';

interface InstructionsEntry {
  // Stable id per distinct instruction string, shared across documents (the id
  // only has to be unique within each root, and each root creates its own node
  // lazily under that id).
  id: string;
  /**
   * Draggables currently referencing this text, counted *per root*: each root
   * owns its own node, so each has to die on its own last release. A single
   * global count would keep every root this text was ever used in strongly
   * reachable (a detached ShadowRoot, a closed popout's document) for as long as
   * one draggable anywhere still uses the same string.
   */
  countsByRoot: Map<Document | ShadowRoot, number>;
}

interface InstructionsState {
  entriesByText: Map<string, InstructionsEntry>;
  nextInstructionIndex: number;
}

// Route the id allocation through a shared slot (like the other engine
// singletons) so two bundled copies of the engine don't allocate colliding ids.
const state = getSharedSlot<InstructionsState>('keyboardInstructions', () => ({
  entriesByText: new Map<string, InstructionsEntry>(),
  nextInstructionIndex: 0,
}));

function entryForText(text: string): InstructionsEntry {
  let entry = state.entriesByText.get(text);
  if (entry === undefined) {
    entry = {
      id: `${INSTRUCTIONS_ID_PREFIX}-${state.nextInstructionIndex}`,
      countsByRoot: new Map(),
    };
    state.nextInstructionIndex += 1;
    state.entriesByText.set(text, entry);
  }
  return entry;
}

/** A hold on one instructions node, released through {@link InstructionsHold.release}. */
export interface InstructionsHold {
  /** The node's id, for `aria-describedby`. */
  id: string;
  /**
   * Drop this hold, removing the node once its root has none left. Idempotent.
   * The hold owns the exact (text, root) pair it was taken against, so a
   * draggable that moved between roots can never release the wrong node.
   */
  release: () => void;
}

/**
 * Ensure the instructions node for `text` exists in `reference`'s root and
 * return a hold on it. Each distinct string gets its own node per root.
 *
 * Ref-counted: every call must be paired with `release`, or a consumer
 * interpolating per-item text (`Press space to move ${item.name}`) would strand
 * one node per unique string for the page's life.
 */
export function ensureKeyboardInstructions(reference: Element, text: string): InstructionsHold {
  // ARIA IDREFs (`aria-describedby`) don't cross shadow boundaries, so a
  // draggable in a shadow root needs its instructions node inside that same
  // root — not the document body. Create it in the element's root node.
  //
  // `text` is required: localization-aware resolution lives in one place, the
  // engine (`DragEngineImpl`), which always passes a resolved string — a
  // second defaulting layer here would be unreachable and could drift.
  const root = reference.getRootNode();
  const doc = ownerDocument(reference);
  const entry = entryForText(text);
  const { id } = entry;
  // A ShadowRoot has no `<body>`; append to the root itself. A Document does, so
  // append to its body. Both expose `getElementById`. A detached
  // element is its own root — neither applies (and `getElementById` doesn't
  // exist on it), so fall back to the owner document.
  let searchRoot: Document | ShadowRoot;
  let container: ParentNode;
  if (root.nodeType === Node.DOCUMENT_NODE) {
    searchRoot = root as Document;
    // `body` can be null for a document registered against before its
    // `<body>` is parsed (imperative registration from a head script).
    container = (root as Document).body ?? (root as Document).documentElement;
  } else if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    searchRoot = root as ShadowRoot;
    container = root as ShadowRoot;
  } else {
    searchRoot = doc;
    container = doc.body ?? doc.documentElement;
  }
  entry.countsByRoot.set(searchRoot, (entry.countsByRoot.get(searchRoot) ?? 0) + 1);
  if (!searchRoot.getElementById(id)) {
    const node = doc.createElement('div');
    node.id = id;
    Object.assign(node.style, visuallyHidden);
    node.textContent = text;
    container.appendChild(node);
  }

  let released = false;
  return {
    id,
    release() {
      if (released) {
        return;
      }
      released = true;
      const remaining = (entry.countsByRoot.get(searchRoot) ?? 1) - 1;
      if (remaining > 0) {
        entry.countsByRoot.set(searchRoot, remaining);
        return;
      }
      entry.countsByRoot.delete(searchRoot);
      searchRoot.getElementById(id)?.remove();
      // Nothing anywhere references this text any more; drop the entry so the
      // roots map doesn't outlive the nodes it tracked.
      if (entry.countsByRoot.size === 0 && state.entriesByText.get(text) === entry) {
        state.entriesByText.delete(text);
      }
    },
  };
}

/** Remove the instructions nodes. Test-only. */
export function resetKeyboardInstructionsForTests(doc: Document = document): void {
  for (const entry of state.entriesByText.values()) {
    for (const root of entry.countsByRoot.keys()) {
      root.getElementById(entry.id)?.remove();
    }
    doc.getElementById(entry.id)?.remove();
  }
  state.entriesByText.clear();
  state.nextInstructionIndex = 0;
}
