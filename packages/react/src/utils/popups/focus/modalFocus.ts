import { isElement, isShadowRoot } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { contains, getTarget } from '@base-ui/utils/shadowDom';
import type { PopupInteractionStore } from '../types';
import {
  collectOutsideElements,
  correctElements,
  buildKeepSet,
  markOthers,
  liveRegionSelector,
} from './markOthers';

export interface FocusScope {
  parent: FocusScope | null;
  owner: PopupInteractionStore;
  isOpen: () => boolean;
  modal: boolean;
  inert: boolean;
  initialFocusElement: Element | null;
  getElements: () => Element[];
  getPortalElement: () => HTMLElement | null;
  handleFocus?: ((event: FocusEvent) => void) | undefined;
}

interface ModalDocument {
  scopes: FocusScope[];
  inertElements: Map<Element, string | null>;
  cleanupMarking: () => void;
  observer: MutationObserver;
  shadowRoots: Set<ShadowRoot>;
  handleFocus: (event: Event) => void;
  handlePointer: (event: Event) => void;
}

const documents = new WeakMap<Document, ModalDocument>();
const pointerEvents = [
  'pointerdown',
  'pointerup',
  'click',
  'auxclick',
  'dblclick',
  'contextmenu',
] as const;
// Interaction views share the Root context, which identifies their common owner.
const openOrder = new WeakMap<object, number>();
let nextOpenOrder = 0;

function getParentOwner(owner: PopupInteractionStore, scopes: FocusScope[]) {
  const anchor = owner.select('anchorElement');
  const triggerOwner = anchor ? owner.context.triggerElements.getOwner(anchor) : undefined;
  return triggerOwner === undefined
    ? (owner.context.parentPopup ??
        scopes.find((scope) => scope.owner.context === owner.context)?.parent?.owner)
    : triggerOwner;
}

function getParentScope(scope: FocusScope, scopes: FocusScope[]): FocusScope | undefined {
  const lineage: PopupInteractionStore[] = [];
  let cycleBreak: PopupInteractionStore | undefined;
  for (
    let owner: PopupInteractionStore | null | undefined = scope.owner;
    owner;
    owner = getParentOwner(owner, scopes)
  ) {
    const context = owner.context;
    const index = lineage.findIndex((entry) => entry.context === context);
    if (index !== -1) {
      // An already-open root can adopt a trigger in its own child. The latest
      // opening interaction wins over that older association, keeping a tree.
      cycleBreak = lineage.slice(index).reduce((oldest, candidate) => {
        const time = candidate.context.openEvent?.timeStamp ?? 0;
        const previous = oldest.context.openEvent?.timeStamp ?? 0;
        return time < previous ||
          (time === previous &&
            (openOrder.get(candidate.context) ?? 0) < (openOrder.get(oldest.context) ?? 0))
          ? candidate
          : oldest;
      });
      break;
    }
    lineage.push(owner);
  }
  for (
    let owner: PopupInteractionStore | null | undefined = scope.owner;
    owner && owner.context !== cycleBreak?.context;
  ) {
    owner = getParentOwner(owner, scopes);
    const parent = scopes.find((other) => other.owner.context === owner?.context);
    if (parent) {
      return parent;
    }
  }
  return undefined;
}

export function getParentFocusScope(scope: FocusScope, doc: Document): FocusScope | undefined {
  return getParentScope(scope, documents.get(doc)?.scopes ?? []);
}

function isDescendant(scope: FocusScope, ancestor: FocusScope, scopes: FocusScope[]): boolean {
  for (
    let parent = getParentScope(scope, scopes);
    parent;
    parent = getParentScope(parent, scopes)
  ) {
    if (parent === ancestor) {
      return true;
    }
  }
  return false;
}

function getActiveScope(state: ModalDocument): FocusScope | undefined {
  // Children commit before parents. Compare ancestry before registration order so
  // an initially-open parent cannot displace its already-open child.
  const modalScopes = state.scopes.filter((scope) => scope.modal);
  return modalScopes
    .filter((scope) => !modalScopes.some((other) => isDescendant(other, scope, state.scopes)))
    .sort((a, b) => (openOrder.get(a.owner.context) ?? 0) - (openOrder.get(b.owner.context) ?? 0))
    .pop();
}

function getInertScope(state: ModalDocument): FocusScope | undefined {
  // A focus-only child does not release its parent's pointer exclusion.
  let scope = getActiveScope(state);
  while (scope && !scope.inert) {
    scope = getParentScope(scope, state.scopes);
  }
  return scope;
}

function getInsideElements(state: ModalDocument, active = getActiveScope(state)): Element[] {
  return active
    ? state.scopes
        .filter((scope) => scope === active || isDescendant(scope, active, state.scopes))
        .flatMap((scope) => [
          ...scope.getElements(),
          ...(scope.initialFocusElement ? [scope.initialFocusElement] : []),
        ])
    : [];
}

function getShadowRoots(scopes: FocusScope[]): Set<ShadowRoot> {
  const roots = new Set<ShadowRoot>();
  for (const element of scopes.flatMap((scope) => {
    const anchor = scope.owner.select('anchorElement');
    return [
      ...scope.getElements(),
      ...(scope.initialFocusElement ? [scope.initialFocusElement] : []),
      // Discover an external opener's root without admitting the opener as popup content.
      ...(anchor ? [anchor] : []),
    ];
  })) {
    let root = element.getRootNode();
    while (isShadowRoot(root)) {
      roots.add(root);
      root = root.host.getRootNode();
    }
  }
  return roots;
}

// Closed roots retarget document events to their host. Registered elements give
// us the owning root references without treating its whole host as inside.
function resolveFocusTarget(
  element: Element,
  roots = documents.get(ownerDocument(element))?.shadowRoots,
): Element {
  let current = element;
  while (roots) {
    let shadow: ShadowRoot | undefined;
    for (const root of roots) {
      if (root.host === current && root.activeElement) {
        shadow = root;
        break;
      }
    }
    if (!shadow?.activeElement) {
      break;
    }
    current = shadow.activeElement;
  }
  return current;
}

export function isFocusAllowed(element: Element): boolean {
  const state = documents.get(ownerDocument(element));
  const target = resolveFocusTarget(element);
  return (
    !state ||
    !getActiveScope(state) ||
    getInsideElements(state).some((inside) => contains(inside, target))
  );
}

export function refreshModalFocus(doc: Document): void {
  const state = documents.get(doc);
  if (!state) {
    return;
  }

  const roots = getShadowRoots(state.scopes);
  if (
    roots.size !== state.shadowRoots.size ||
    Array.from(roots).some((root) => !state.shadowRoots.has(root))
  ) {
    state.observer.disconnect();
    state.shadowRoots.forEach((root) => {
      root.removeEventListener('focus', state.handleFocus, true);
      pointerEvents.forEach((type) => root.removeEventListener(type, state.handlePointer, true));
    });
    state.observer.observe(doc.body, { childList: true, subtree: true });
    roots.forEach((root) => {
      state.observer.observe(root, { childList: true, subtree: true });
      root.addEventListener('focus', state.handleFocus, true);
      pointerEvents.forEach((type) => root.addEventListener(type, state.handlePointer, true));
    });
    state.shadowRoots = roots;
  }

  const inside = correctElements(doc.body, getInsideElements(state));
  const inertScope = getInertScope(state);
  const interactionInside = inertScope ? getInsideElements(state, inertScope) : [];
  const outside = new Set<Element>();
  // A shadow host can be an allowed body branch without making its other
  // shadow children part of the modal. Exclude siblings in each owning root.
  for (const root of [doc.body, ...roots]) {
    if (isShadowRoot(root) && interactionInside.some((inside) => contains(inside, root.host))) {
      continue;
    }
    const targets = correctElements(root, interactionInside);
    if (targets.length) {
      collectOutsideElements(root, buildKeepSet(targets), new Set(targets), true).forEach(
        (element) => outside.add(element),
      );
    }
  }

  // Restore only attributes we own. `inert="false"` is still a boolean true;
  // preserving the original string also preserves author state across nesting.
  state.inertElements.forEach((value, element) => {
    if (!outside.has(element)) {
      if (value === null) {
        element.removeAttribute('inert');
      } else {
        element.setAttribute('inert', value);
      }
      state.inertElements.delete(element);
    }
  });
  outside.forEach((element) => {
    if (!state.inertElements.has(element)) {
      state.inertElements.set(element, element.getAttribute('inert'));
    }
    if (!element.hasAttribute('inert')) {
      element.setAttribute('inert', '');
    }
  });

  state.cleanupMarking();
  state.cleanupMarking = inside.length
    ? markOthers(inside, { ariaHidden: true, mark: false })
    : () => {};
}

export function registerFocusScope(scope: FocusScope, doc: Document): () => void {
  let state = documents.get(doc);
  if (!state) {
    const observer = new doc.defaultView!.MutationObserver(() => refreshModalFocus(doc));
    const handleFocus = (event: Event) => {
      const current = documents.get(doc);
      if (!current) {
        return;
      }
      const eventTarget = getTarget(event);
      if (isElement(eventTarget)) {
        const target = resolveFocusTarget(eventTarget);
        let retired = false;
        // Entry into a child portal also ends its ancestors' temporary exceptions.
        for (const scope of current.scopes) {
          if (
            scope.initialFocusElement &&
            !contains(scope.initialFocusElement, target) &&
            current.scopes.some(
              (other) =>
                (other === scope || isDescendant(other, scope, current.scopes)) &&
                other.getElements().some((inside) => contains(inside, target)),
            )
          ) {
            scope.initialFocusElement = null;
            retired = true;
          }
        }
        if (retired) {
          refreshModalFocus(doc);
        }
      }
      getActiveScope(current)?.handleFocus?.(event as FocusEvent);
    };
    const handlePointer = (event: Event) => {
      const current = documents.get(doc);
      const scope = current && getInertScope(current);
      if (!current || !scope) {
        return;
      }
      const path = event.composedPath();
      if (!path.some((node) => isElement(node) && node.matches(liveRegionSelector))) {
        return;
      }
      const target = getTarget(event);
      // A closed root exposes only its host at document capture. Its own capture
      // listener can distinguish allowed popup content from outside siblings.
      if (Array.from(current.shadowRoots).some((root) => root.host === target)) {
        return;
      }
      if (
        isElement(target) &&
        getInsideElements(current, scope).some((inside) => contains(inside, target))
      ) {
        return;
      }
      // Announcements remain accessible, but their arbitrary pointer handlers
      // and shadow descendants must obey the same modal exclusion as inert content.
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    state = {
      scopes: [],
      inertElements: new Map(),
      cleanupMarking: () => {},
      observer,
      shadowRoots: new Set(),
      handleFocus,
      handlePointer,
    };
    documents.set(doc, state);
    doc.addEventListener('focus', handleFocus, true);
    pointerEvents.forEach((type) => doc.addEventListener(type, handlePointer, true));
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  const current = state;
  // Portal container changes remount managers without reopening their root.
  // Keep that root's place until its open session actually ends.
  if (!openOrder.has(scope.owner.context)) {
    nextOpenOrder += 1;
    openOrder.set(scope.owner.context, nextOpenOrder);
  }
  current.scopes.push(scope);
  // Registration supplies the known closed roots missing from document.activeElement.
  if (scope.initialFocusElement) {
    scope.initialFocusElement = resolveFocusTarget(
      scope.initialFocusElement,
      getShadowRoots(current.scopes),
    );
  }
  refreshModalFocus(doc);

  return () => {
    current.scopes.splice(current.scopes.indexOf(scope), 1);
    if (!scope.isOpen()) {
      openOrder.delete(scope.owner.context);
    }
    refreshModalFocus(doc);
    if (current.scopes.length === 0) {
      current.observer.disconnect();
      current.shadowRoots.forEach((root) => {
        root.removeEventListener('focus', current.handleFocus, true);
        pointerEvents.forEach((type) =>
          root.removeEventListener(type, current.handlePointer, true),
        );
      });
      doc.removeEventListener('focus', current.handleFocus, true);
      pointerEvents.forEach((type) => doc.removeEventListener(type, current.handlePointer, true));
      documents.delete(doc);
    }
  };
}
