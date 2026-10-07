import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isElement } from '@floating-ui/utils/dom';
import { copyElementState } from './cloneDragPreview';
import {
  copyContentNode,
  copyPreviewContent,
  getPreviewRootSource,
  isCopiedNode,
} from './previewContent';
import type { PreviewContent, PreviewContentCopy } from './previewContent';
import { getOrCreate, getSubtreeElements } from '../utils';

export interface PreviewContentUpdateCallbacks {
  /**
   * The copy's root was created, replaced, or removed. `null` means the content
   * rendered nothing, which declines the preview until it renders again.
   */
  onRoot: (root: HTMLElement | null) => void;
  /**
   * The copy's root has new attributes. The engine writes its own back on top of
   * `ownStyle`, the root's inline style in the content.
   */
  onRootChange: (ownStyle: string) => void;
}

// The source root's attributes each root copy was last updated with, so an update
// that leaves them alone doesn't make the engine write its own state again.
const rootAttributes = new WeakMap<Node, string>();

// Attributes are sanitized in a document without a browsing context, which loads
// nothing. One per page document.
const inertDocuments = new WeakMap<Document, Document>();

/**
 * Bring the copy of a custom preview's content up to date. Only what changed is
 * written, so transitions in the copy run as they would in place and images don't
 * reload. The root is kept, so the preview stays in the top layer. A new kind of
 * root (content that now renders several nodes) is copied from scratch. Field state
 * and canvas pixels are copied, scroll positions are not.
 */
export function updatePreviewContent(
  content: PreviewContent,
  callbacks: PreviewContentUpdateCallbacks,
): void {
  const { container } = content;
  const copy = content.copy;
  const rootSource = getPreviewRootSource(container);
  if (!copy?.root || rootSource !== copy.rootSource) {
    content.copy = copyPreviewContent(content);
    callbacks.onRoot(content.copy.root);
    return;
  }

  const root = copy.root;
  const idsBefore = copy.sanitizer.rewrittenIdCount;
  const added: Element[] = [];
  if (rootSource) {
    const attributes = JSON.stringify(
      Array.from(rootSource.attributes, (attribute) => [attribute.name, attribute.value]),
    );
    if (rootAttributes.get(root) !== attributes) {
      rootAttributes.set(root, attributes);
      // The engine writes its own attributes and the inline style back right after.
      syncAttributes(rootSource, root, copy, true);
      callbacks.onRootChange((rootSource as Partial<ElementCSSInlineStyle>).style?.cssText ?? '');
      // `ownStyle` has the original `url(#id)` references again.
      copy.sanitizer.remapReferences(root);
    }
    syncChildren(rootSource, root, copy, added);
    copyElementState(rootSource, root, ownerWindow(root));
  } else {
    syncChildren(container, root, copy, added);
  }

  // A new id can be referenced from anywhere in the copy, so it remaps the whole copy.
  // Otherwise only the new nodes need it.
  const remapped = copy.sanitizer.rewrittenIdCount === idsBefore ? added : getSubtreeElements(root);
  for (const element of remapped) {
    copy.sanitizer.remapReferences(element);
  }
}

/**
 * Make the children of `target` the copies of the children of `source`, in order.
 * Copies that are still paired are updated in place, and moved if their content node
 * moved. New nodes are copied, and copies of removed nodes are removed.
 */
function syncChildren(source: Node, target: Node, copy: PreviewContentCopy, added: Element[]) {
  let next = target.firstChild;
  for (const child of Array.from(source.childNodes)) {
    if (!isCopiedNode(child)) {
      continue;
    }
    let childCopy = copy.copies.get(child);
    const existing = childCopy !== undefined;
    childCopy ??= copyContentNode(child, copy, added);
    if (childCopy !== next) {
      target.insertBefore(childCopy, next);
    }
    // A descendant update may move our next sibling into another parent. Place
    // this child before descending, then read its next sibling from the final tree.
    if (existing) {
      syncNode(child, childCopy, copy, added);
    }
    next = childCopy.nextSibling;
  }
  while (next) {
    const stale = next;
    next = next.nextSibling;
    target.removeChild(stale);
  }
}

function syncNode(source: Node, target: Node, copy: PreviewContentCopy, added: Element[]) {
  if (isElement(source)) {
    syncAttributes(source, target as Element, copy, false);
    syncChildren(source, target, copy, added);
    // After the children, so a select's options are there.
    copyElementState(source, target as Element, ownerWindow(source));
  } else if (target.nodeValue !== source.nodeValue) {
    target.nodeValue = source.nodeValue;
  }
}

/**
 * Make `target`'s attributes match `source`'s, sanitized on an inert element first so the
 * page never holds an unsafe value (a radio given a page group's `name` would uncheck the
 * page's radio). The inline style goes through the CSSOM for CSP (see
 * `remapInlineStyleUrls`); on the root, the engine writes it and keeps `popover`.
 */
function syncAttributes(
  source: Element,
  target: Element,
  copy: PreviewContentCopy,
  isRoot: boolean,
) {
  const doc = ownerDocument(target);
  const inertDocument = getOrCreate(inertDocuments, doc, () =>
    doc.implementation.createHTMLDocument(''),
  );
  const scratch = inertDocument.importNode(source, false);
  copy.sanitizer.neutralize(scratch);
  copy.sanitizer.rewriteId(scratch);
  copy.sanitizer.remapReferences(scratch);

  for (const attribute of Array.from(target.attributes)) {
    if (
      attribute.name !== 'style' &&
      !(isRoot && attribute.name === 'popover') &&
      !scratch.hasAttributeNS(attribute.namespaceURI, attribute.localName)
    ) {
      target.removeAttributeNS(attribute.namespaceURI, attribute.localName);
    }
  }
  for (const attribute of Array.from(scratch.attributes)) {
    if (
      attribute.name !== 'style' &&
      target.getAttributeNS(attribute.namespaceURI, attribute.localName) !== attribute.value
    ) {
      target.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
    }
  }

  const sourceStyle = (source as Partial<ElementCSSInlineStyle>).style;
  const targetStyle = (target as Partial<ElementCSSInlineStyle>).style;
  if (!isRoot && sourceStyle && targetStyle && targetStyle.cssText !== sourceStyle.cssText) {
    targetStyle.cssText = sourceStyle.cssText;
    // The style came back from the content as is, so its `url(#id)` references point
    // at the original ids again.
    copy.sanitizer.remapReferences(target);
  }
}
