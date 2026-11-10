import { ownerWindow } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { getComposedParentElement } from '../../utils/popups/focus/tabbable';

const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'listbox',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
  'treeitem',
  'row',
  'treegrid',
]);

/** Whether `node` owns its interaction. A label does when its control is inside `row`. */
function isInteractiveElement(node: Element, row: Element): boolean {
  const win = ownerWindow(node);
  if (
    node instanceof win.HTMLButtonElement ||
    node instanceof win.HTMLInputElement ||
    node instanceof win.HTMLSelectElement ||
    node instanceof win.HTMLTextAreaElement
  ) {
    // Disabled controls still own pointer interaction. Treating them as row
    // content would select or expand the item when their descendants receive a
    // browser event.
    return true;
  }
  if (node instanceof win.HTMLLabelElement) {
    const control = node.control;
    return control != null && contains(row, control);
  }
  if (node.localName === 'a') {
    return node.hasAttribute('href');
  }
  if (node.localName === 'audio' || node.localName === 'video') {
    return node.hasAttribute('controls');
  }
  if (!(node instanceof win.HTMLElement)) {
    return false;
  }
  return (
    node.isContentEditable ||
    node.localName === 'summary' ||
    INTERACTIVE_ROLES.has(node.getAttribute('role') ?? '')
  );
}

/**
 * Whether `target` is inside interactive content of `row`, which owns the events it
 * receives. `isOwner` also claims the event, for example for a registered control.
 */
export function isWithinInteractiveContent(
  target: Element,
  row: Element,
  isOwner: (node: Element) => boolean,
): boolean {
  for (
    let node: Element | null = target;
    node !== null && node !== row;
    node = getComposedParentElement(node)
  ) {
    if (isOwner(node) || isInteractiveElement(node, row)) {
      return true;
    }
  }
  return false;
}
