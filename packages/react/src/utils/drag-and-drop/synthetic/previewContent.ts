import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { isElement } from '@floating-ui/utils/dom';
import { copyElementState, createPreviewSanitizer } from './cloneDragPreview';
import type { DraggablePreviewRenderParameters } from '../../../draggable/preview/DraggablePreview';
import type { PreviewSanitizer } from './cloneDragPreview';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const COMMENT_NODE = 8;

/**
 * A custom preview's content: the detached element React renders it into, and the
 * copy of it the engine shows. The engine copies the content once, after its first
 * commit. `Draggable.updatePreview()` brings the copy up to date later.
 */
export interface PreviewContent {
  /**
   * The detached element React renders the content into, with the same tag as the
   * element the copy goes into. It never enters the document, so the content can't
   * be seen or measured there.
   */
  container: HTMLElement;
  /** The element the copy goes into, whose root decides which ids the copy keeps. */
  parent: Node | undefined;
  /** The latest copy, or `null` until the content has rendered. */
  copy: PreviewContentCopy | null;
  /**
   * Publishes the content again with the given `source` and `location`, for
   * `Draggable.updatePreview()`. Set by the React layer when it publishes the content.
   */
  render?: ((parameters: DraggablePreviewRenderParameters) => void) | undefined;
  /**
   * Brings the copy up to date. `Draggable.updatePreview()` sets it, and the engine
   * runs it after the next commit of the content instead of doing nothing.
   */
  update?: (() => void) | undefined;
}

/** A copy of a custom preview's content. */
export interface PreviewContentCopy {
  /**
   * The preview element: a copy of the content's only HTML element, or a `div` around
   * the content. `null` when the content rendered nothing, which declines the preview.
   */
  root: HTMLElement | null;
  /** What `getPreviewRootSource` returned for the content this copy was made from. */
  rootSource: Element | null | undefined;
  /** Each copied content node to its copy. */
  copies: WeakMap<Node, Node>;
  /** The rules the copy was sanitized with, which keep its id rewrites consistent. */
  sanitizer: PreviewSanitizer;
}

/**
 * Create the detached element React renders a custom preview into. It takes the tag
 * and namespace of the element the copy is inserted into. React then checks the
 * content's nesting against the place it appears in, so a `<div>` preview for a
 * `<tbody>` gets React's own warning (React checks tables and selects, not lists),
 * and content for an SVG parent is created in the SVG namespace.
 */
export function createPreviewContentContainer(doc: Document, parent: Node | undefined) {
  return (
    parent && isElement(parent)
      ? doc.createElementNS(parent.namespaceURI, parent.localName)
      : doc.createElement('div')
  ) as HTMLElement;
}

/** Whether `node` belongs in the copy. Scripts are left out, so they never run in it. */
export function isCopiedNode(node: Node): boolean {
  const type = node.nodeType;
  if (type === ELEMENT_NODE) {
    return (node as Element).localName !== 'script';
  }
  return type === TEXT_NODE || type === CDATA_SECTION_NODE || type === COMMENT_NODE;
}

/**
 * The content element the preview element copies. One HTML root element becomes the
 * preview element itself, so its tag is the one the consumer chose. `null` when the
 * content is several nodes, text, or an SVG root, which can't enter the top layer, so
 * the copy wraps it in a `div`. `undefined` when the content rendered nothing.
 */
export function getPreviewRootSource(container: HTMLElement): Element | null | undefined {
  const nodes = Array.from(container.childNodes).filter(
    (child) =>
      isCopiedNode(child) &&
      (child.nodeType === ELEMENT_NODE ||
        (child.nodeType !== COMMENT_NODE && child.textContent?.trim() !== '')),
  );
  if (nodes.length === 0) {
    return undefined;
  }
  const only = nodes.length === 1 ? nodes[0] : null;
  return only && isElement(only) && only.namespaceURI === HTML_NAMESPACE ? only : null;
}

/**
 * Copy `node` and its subtree into `copy`, pairing every copied node. The copy is
 * sanitized while it is still detached, so the document never holds an unsafe node,
 * even for the time of one call. Collects the copied elements in `elements`, whose
 * references the caller remaps once every id is known.
 */
export function copyContentNode(node: Node, copy: PreviewContentCopy, elements: Element[]): Node {
  const result = node.cloneNode(false);
  copy.copies.set(node, result);
  if (isElement(node)) {
    const element = result as Element;
    elements.push(element);
    copy.sanitizer.neutralize(element);
    copy.sanitizer.rewriteId(element);
    for (const child of Array.from(node.childNodes)) {
      if (isCopiedNode(child)) {
        element.appendChild(copyContentNode(child, copy, elements));
      }
    }
    // After the children, so a select's options are there.
    copyElementState(node, element, ownerWindow(node));
  }
  return result;
}

/** Copy the content of `container` from scratch. */
export function copyPreviewContent(content: PreviewContent): PreviewContentCopy {
  const { container, parent } = content;
  // The content renders off-document, so its ids only collide with the page when the
  // page already uses them. Only those are rewritten, so `#id` selectors and
  // `getElementById` still reach the copy otherwise. An id the preview itself holds
  // is its own.
  const pageRoot = parent?.getRootNode() as Partial<NonElementParentNode> | undefined;
  const copy: PreviewContentCopy = {
    root: null,
    rootSource: getPreviewRootSource(container),
    copies: new WeakMap(),
    sanitizer: createPreviewSanitizer({
      keepId: (id) => {
        const owner = pageRoot?.getElementById?.(id);
        return !owner || contains(content.copy?.root, owner);
      },
    }),
  };
  const elements: Element[] = [];
  if (copy.rootSource) {
    copy.root = copyContentNode(copy.rootSource, copy, elements) as HTMLElement;
  } else if (copy.rootSource === null) {
    copy.root = ownerDocument(container).createElement('div');
    for (const child of Array.from(container.childNodes)) {
      if (isCopiedNode(child)) {
        copy.root.appendChild(copyContentNode(child, copy, elements));
      }
    }
  }
  for (const element of elements) {
    copy.sanitizer.remapReferences(element);
  }
  return copy;
}
