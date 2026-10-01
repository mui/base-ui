import { ownerWindow } from '@base-ui/utils/owner';
import { isElement } from '@floating-ui/utils/dom';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { copyElementState, createPreviewSanitizer } from './cloneDragPreview';
import type { PreviewSanitizer } from './cloneDragPreview';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const LIVE_STATE = 'input, textarea, select, details, canvas';
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const COMMENT_NODE = 8;

export interface PreviewContentMirrorCallbacks {
  /**
   * The copy's root was created, replaced, or removed. `null` means the content
   * rendered nothing, which declines the preview until it renders again.
   */
  onRoot: (root: HTMLElement | null) => void;
  /**
   * An attribute of the copy's root changed. The engine owns some of the root's
   * attributes and inline styles, so it writes them back on top of `ownStyle`, the
   * root's own inline style in the content.
   */
  onRootChange: (ownStyle: string) => void;
}

/**
 * The React-rendered content of a custom preview, copied into an element the engine
 * owns, like the clone of a source.
 */
export interface PreviewContentMirror {
  /**
   * The detached element React renders the content into, with the same tag as the
   * element the copy goes into. It never enters the document, so the content can't
   * be seen or measured there.
   */
  readonly container: HTMLElement;
  /** Apply pending content changes now instead of in the observer's microtask. */
  flush(): void;
  /**
   * Copy the state of fields and canvases, which changes without a mutation (see
   * `copyElementState`). `flush` does it too, and the mirror does it on every frame
   * while the content has any.
   */
  syncLiveState(): void;
  /** Apply pending changes, then stop. The copy keeps its last state. */
  stop(): void;
}

/**
 * Mirror a custom preview's content into a sanitized copy, the way the default
 * preview clones its source.
 *
 * The content stays a live React tree, so the components in it can keep state and
 * subscribe to the drag. A `MutationObserver` replays every change React makes to
 * it on the copy, in the microtask after the commit, so it shows in the same frame.
 * Each node of the content is paired with its copy, and a change is applied node by
 * node. The copy's root is never replaced for a change below it, so the preview
 * stays open in the top layer, and transitions inside it run as they would in place.
 *
 * Field state and canvas pixels, which change without a mutation, are copied on
 * every frame while the content has any. A scroll position inside the content is
 * not mirrored. When a change can't be matched to the copy, the whole copy is
 * rebuilt instead.
 */
export function createPreviewContentMirror(
  doc: Document,
  parent: Node | undefined,
  callbacks: PreviewContentMirrorCallbacks,
): PreviewContentMirror {
  const win = ownerWindow(doc.documentElement);
  // The container takes the tag and namespace of the element the copy is inserted
  // into. React then checks the content's nesting against the place it appears in,
  // so a `<div>` preview for a `<tbody>` gets React's own warning (React checks
  // tables and selects, not lists), and content for an SVG parent is created in the
  // SVG namespace.
  const container =
    parent && isElement(parent)
      ? (doc.createElementNS(parent.namespaceURI, parent.localName) as HTMLElement)
      : doc.createElement('div');
  // Each content node to its copy. When the content is wrapped in a `div` (see
  // `rebuild`), `container` itself maps to nothing.
  let copies = new WeakMap<Node, Node>();
  // The content renders off-document, so its ids only collide with the page when
  // the page already uses them. Only those are rewritten, so `#id` selectors and
  // `getElementById` still reach the copy otherwise.
  const pageRoot = parent?.getRootNode() as Partial<NonElementParentNode> | undefined;
  // Attributes are sanitized on elements of this document first (see `syncAttribute`).
  let inertDocument: Document | null = null;
  const createSanitizer = () =>
    createPreviewSanitizer({
      keepId: (id) =>
        typeof pageRoot?.getElementById !== 'function' || !pageRoot.getElementById(id),
    });
  let sanitizer: PreviewSanitizer = createSanitizer();
  let root: HTMLElement | null = null;
  // The content element the root is a copy of, or `null` for the `div` wrapper.
  let rootSource: Element | null = null;
  let stopped = false;
  // Field state and canvas pixels change without any mutation: React sets fields
  // through DOM properties, and drawing doesn't touch the DOM. A component in the
  // content can do either while the pointer rests. While the content has fields or
  // canvases, the copy reads them on every frame.
  const liveFrame = new WindowAnimationFrame(win);
  let pollingLiveState = false;

  function pollLiveState(): void {
    if (stopped || !pollingLiveState) {
      return;
    }
    syncLiveState();
    liveFrame.request(pollLiveState);
  }

  function updateLiveStatePolling(): void {
    const hasLiveState = root !== null && container.querySelector(LIVE_STATE) !== null;
    if (hasLiveState && !pollingLiveState) {
      pollingLiveState = true;
      liveFrame.request(pollLiveState);
    } else if (!hasLiveState && pollingLiveState) {
      pollingLiveState = false;
      liveFrame.cancel();
    }
  }

  function isCopied(node: Node): boolean {
    const type = node.nodeType;
    if (type === ELEMENT_NODE) {
      return (node as Element).localName !== 'script';
    }
    return type === TEXT_NODE || type === CDATA_SECTION_NODE || type === COMMENT_NODE;
  }

  /**
   * Copy `node` and its subtree, pairing every copied node. Scripts are left out, so
   * they never run in the preview. Collects the copied elements for `prepareCopied`.
   */
  function copyTree(node: Node, copyElements: Element[]): Node {
    const copy = node.cloneNode(false);
    copies.set(node, copy);
    if (isElement(node)) {
      copyElements.push(copy as Element);
      for (const child of Array.from(node.childNodes)) {
        if (isCopied(child)) {
          copy.appendChild(copyTree(child, copyElements));
        }
      }
    }
    return copy;
  }

  /** Every element of the copy, root included. */
  function getCopyElements(): Element[] {
    return root ? [root, ...Array.from(root.querySelectorAll('*'))] : [];
  }

  /**
   * Sanitize a freshly copied subtree while it is still detached, so the document
   * never holds an unsafe node, even for the time of one call.
   */
  function prepareCopied(copyElements: Element[]): void {
    for (const copy of copyElements) {
      sanitizer.neutralize(copy);
      sanitizer.rewriteId(copy);
    }
  }

  /**
   * Copy the state of the content's fields and canvases. React sets a controlled
   * field's value, its checked state and a select's selection through DOM
   * properties, which no mutation record reports. The copied radios have no `name`,
   * so checking one never affects the page's radio groups.
   */
  function syncLiveState(): void {
    if (root === null) {
      return;
    }
    for (const node of Array.from(container.querySelectorAll(LIVE_STATE))) {
      copyElementState(node, copies.get(node), win);
    }
  }

  /**
   * Copy the content from scratch. One HTML root element becomes the preview element
   * itself, so its tag is the one the consumer chose. Several nodes, text, or an SVG
   * root, which can't enter the top layer, are wrapped in a `div`.
   */
  function rebuild(): void {
    copies = new WeakMap();
    sanitizer = createSanitizer();
    const children = Array.from(container.childNodes).filter(
      (child) =>
        isCopied(child) &&
        (child.nodeType === ELEMENT_NODE ||
          (child.nodeType !== COMMENT_NODE && child.textContent?.trim() !== '')),
    );
    const copyElements: Element[] = [];
    let next: HTMLElement | null = null;
    rootSource = null;
    const only = children.length === 1 ? children[0] : null;
    if (only && isElement(only) && only.namespaceURI === HTML_NAMESPACE) {
      next = copyTree(only, copyElements) as HTMLElement;
      rootSource = only;
    } else if (children.length > 0) {
      next = doc.createElement('div');
      for (const child of Array.from(container.childNodes)) {
        if (isCopied(child)) {
          next.appendChild(copyTree(child, copyElements));
        }
      }
    }
    root = next;
    if (next) {
      prepareCopied(copyElements);
      for (const element of copyElements) {
        sanitizer.remapReferences(element);
      }
      syncLiveState();
    }
    callbacks.onRoot(next);
  }

  /** Copy the current value of one attribute, sanitized before it reaches the copy. */
  function syncAttribute(source: Element, copy: Element, record: MutationRecord): void {
    const name = record.attributeName!;
    const namespace = record.attributeNamespace;
    if (name === 'style' && namespace === null) {
      // Through the CSSOM. A strict CSP without `'unsafe-inline'` blocks
      // `setAttribute('style', …)`, but not `cssText`.
      const sourceStyle = (source as Partial<ElementCSSInlineStyle>).style;
      const copyStyle = (copy as Partial<ElementCSSInlineStyle>).style;
      if (sourceStyle && copyStyle) {
        copyStyle.cssText = sourceStyle.cssText;
        sanitizer.remapReferences(copy);
      }
      return;
    }
    // Sanitized on an inert element first, by the rules the copy was built with, so
    // the copy in the page never holds an unsafe value, even for one call. A radio
    // given a page group's `name` would uncheck the page's radio at once. An element
    // of a document without a browsing context loads nothing.
    inertDocument ??= doc.implementation.createHTMLDocument('');
    const scratch = inertDocument.createElementNS(copy.namespaceURI, copy.localName);
    const attribute = source.getAttributeNodeNS(namespace, name);
    if (attribute) {
      scratch.setAttributeNS(namespace, attribute.name, attribute.value);
    }
    sanitizer.neutralize(scratch);
    sanitizer.rewriteId(scratch);
    sanitizer.remapReferences(scratch);
    const sanitized = scratch.getAttributeNodeNS(namespace, name);
    if (sanitized) {
      copy.setAttributeNS(namespace, sanitized.name, sanitized.value);
    } else {
      copy.removeAttributeNS(namespace, name);
    }
  }

  /** The copy of the first copied node at or after `node` among its siblings. */
  function findCopiedSibling(node: Node | null): Node | null {
    for (let sibling = node; sibling !== null; sibling = sibling.nextSibling) {
      const copy = copies.get(sibling);
      if (copy) {
        return copy;
      }
    }
    return null;
  }

  /**
   * Apply one batch of records. Returns `false` when a change can't be matched to the
   * copy, in which case the caller rebuilds it.
   */
  function apply(records: MutationRecord[]): boolean {
    let rootChanged = false;
    const idsBefore = sanitizer.rewrittenIdCount;
    const addedElements: Element[] = [];
    const changedParents = new Set<Node>();
    for (const record of records) {
      const target = record.target;
      // A change to the list of root nodes can change which element is the root.
      if (target === container) {
        return false;
      }
      const copy = copies.get(target);
      if (!copy) {
        // Inside a script, which is never copied.
        const parent = isElement(target) ? target : target.parentElement;
        if (parent?.closest('script')) {
          continue;
        }
        return false;
      }
      if (copy === root) {
        rootChanged = true;
      }
      if (record.type === 'attributes') {
        syncAttribute(target as Element, copy as Element, record);
      } else if (record.type === 'characterData') {
        copy.nodeValue = target.nodeValue;
      } else {
        for (const removed of Array.from(record.removedNodes)) {
          const removedCopy = copies.get(removed);
          if (removedCopy?.parentNode === copy) {
            copy.removeChild(removedCopy);
          }
        }
        const before = findCopiedSibling(record.nextSibling);
        if (before !== null && before.parentNode !== copy) {
          return false;
        }
        for (const added of Array.from(record.addedNodes)) {
          if (isCopied(added)) {
            const copyElements: Element[] = [];
            const addedCopy = copyTree(added, copyElements);
            prepareCopied(copyElements);
            copy.insertBefore(addedCopy, before);
            addedElements.push(...copyElements);
          }
        }
        changedParents.add(target);
      }
    }
    // Records describe intermediate states, so a batch that added and removed the
    // same nodes can leave a parent out of step. Rebuild then instead of guessing.
    for (const parent of changedParents) {
      const copy = copies.get(parent);
      const expected = Array.from(parent.childNodes).filter(isCopied).length;
      if (!copy || copy.childNodes.length !== expected) {
        return false;
      }
    }
    // A new id can be referenced from anywhere in the copy, so it remaps the whole
    // copy, once for the batch. Otherwise only the new nodes need it.
    const remapped = sanitizer.rewrittenIdCount !== idsBefore ? getCopyElements() : addedElements;
    for (const element of remapped) {
      sanitizer.remapReferences(element);
    }
    if (rootChanged && root) {
      callbacks.onRootChange(
        (rootSource as Partial<ElementCSSInlineStyle> | null)?.style?.cssText ?? '',
      );
      // The root's own style came back from the content as is, so its `url(#id)`
      // references point at the original ids again.
      sanitizer.remapReferences(root);
    }
    return true;
  }

  function process(records: MutationRecord[]): void {
    if (stopped) {
      return;
    }
    if (records.length > 0 && !apply(records)) {
      rebuild();
    }
    syncLiveState();
    updateLiveStatePolling();
  }

  const observer = new win.MutationObserver(process);
  observer.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });

  return {
    container,
    flush() {
      process(observer.takeRecords());
    },
    syncLiveState() {
      if (!stopped) {
        syncLiveState();
      }
    },
    stop() {
      if (stopped) {
        return;
      }
      process(observer.takeRecords());
      stopped = true;
      observer.disconnect();
      liveFrame.cancel();
    },
  };
}
