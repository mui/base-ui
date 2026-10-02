import { getNodeName, isHTMLElement } from '@floating-ui/utils/dom';
import { ownerWindow } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { REASONS } from '../../internals/reasons';
import { resolveRef } from '../../utils/resolveRef';
import type { FloatingFocusManagerProps } from '../components/FloatingFocusManager';
import type { CloseRequest } from '../components/FloatingRootStore';
import { closest, getTarget, isTypeableElement } from './element';
import { isVirtualClick, isVirtualPointerEvent } from './event';
import { isTabbable, tabbable } from './tabbable';

/*
 * The focus return policy of `FloatingFocusManager`: what a close meant, where focus goes and
 * whether it goes there. Plain functions over facts the caller samples; the caller schedules the
 * return and moves focus. The facts are only right if the caller keeps these React orderings:
 * - `FloatingPortal` renders its node after its children, so a same-commit deletion runs the
 *   manager's layout cleanup (which samples `ownedFocusAtClose`) before the DOM is detached;
 * - the `aria-hidden` (`markOthers`) effect is a layout effect, so its cleanup has run when the
 *   return is decided in the microtask after the close commit;
 * - the close's facts are snapshotted in the layout cleanup, before passive cleanups remove the
 *   listeners that track them.
 */

export interface CloseIntent {
  /** `focusVisible` on return iff 'keyboard'. */
  type: InteractionType;
  /**
   * Focus was moved away by the user or a guard. Applies while focus is outside, or hasn't moved
   * since the request.
   */
  handoff: boolean;
  /** Focus moved after the request was made. */
  moved: boolean;
  /** Hover-leave, sibling open, or an outside press without `preventScroll`: never return. */
  suppress: boolean;
  /**
   * An outside press closes before the press is done moving focus, so the return waits one task:
   * after the press is released (`'release'`) or right away (`'task'`).
   */
  settle: 'release' | 'task' | undefined;
}

/** What the manager knew when its popup opened. */
export interface ReturnFocusSession {
  reference: Element | null;
  /** The element focused before the popup opened. */
  before: Element | null;
  /** A programmatic open: `before` is preferred over `reference`. */
  preferBefore: boolean;
  /** False for a passive session (a hover-opened Popover): focus returns only from inside. */
  managed: boolean;
  /** The closest ancestor manager's return target once that one has closed (the parent link). */
  parent: { readonly current: (() => Element | null) | null } | null;
}

/** Focus the element with the options, or blur it when there are none. */
export type ReturnFocusAction = [element: HTMLElement, focusOptions?: FocusOptions] | null;

function isFocusEvent(event: Event) {
  return event instanceof ownerWindow(getTarget(event)).FocusEvent;
}

function isBody(element: Element | null) {
  return element != null && getNodeName(element) === 'body';
}

// On outside press, only return focus to the reference when the browser supports the
// `focus({ preventScroll })` option; without it, restoring focus scrolls the page.
// Chrome on Android and Samsung Internet still don't support `preventScroll`
// (https://issues.chromium.org/issues/41453122).
// Not cached: tests stub `HTMLElement.prototype.focus` per test to toggle support.
export function isPreventScrollSupported(doc: Document) {
  let supported = false;
  doc.createElement('div').focus({
    get preventScroll() {
      supported = true;
      return false;
    },
  });
  return supported;
}

function getEventType(event: Event, lastInteractionType?: InteractionType): InteractionType {
  const win = ownerWindow(getTarget(event));
  if (event instanceof win.KeyboardEvent) {
    return 'keyboard';
  }
  if (isFocusEvent(event)) {
    // Focus events can be caused by a preceding pointer interaction (e.g., focusout on outside press).
    // Prefer the last known pointer type if provided, else treat as keyboard.
    return lastInteractionType || 'keyboard';
  }
  if ('pointerType' in event) {
    // A trusted click without a pointerType is keyboard/AT; only synthesized
    // clicks (e.g. a test harness) pair an empty pointerType with a click count.
    return (
      (event.pointerType as InteractionType) ||
      (isVirtualClick(event as PointerEvent) ? 'keyboard' : lastInteractionType || 'mouse')
    );
  }
  if ('touches' in event) {
    return 'touch';
  }
  if (event instanceof win.MouseEvent) {
    // onClick events may not contain pointer events, and will fall through to here
    return lastInteractionType || (event.detail === 0 ? 'keyboard' : 'mouse');
  }
  return '';
}

/**
 * What the close meant for focus. `null` when the close made no request (a prop-driven close, or
 * a component-local one that doesn't dispatch): the defaults apply.
 *
 * @param interactionType The last pointer or keyboard interaction while open.
 * @param pressed Whether a pointer was pressed when the close committed.
 * @param preventScroll Whether `focus({ preventScroll })` is supported; probed only when needed.
 */
export function getCloseIntent(
  request: CloseRequest | undefined,
  interactionType: InteractionType,
  pressed: boolean,
  preventScroll: () => boolean,
): CloseIntent | null {
  if (!request) {
    return null;
  }
  const { details } = request;
  const event = details.nativeEvent;
  const reason = details.reason;
  const outsidePress = reason === REASONS.outsidePress;
  let settle: CloseIntent['settle'];
  if (outsidePress) {
    // An outside press closes before the press is done moving focus: a sloppy press before its
    // default focus, an intentional one before the pressed element's own click handlers. Only a
    // close made by the press itself (sloppy mouse `pointerdown`) has a release to wait for.
    // Touch closes on `touchend`/compatibility `mousedown`, after `pointerup`.
    settle = pressed && event.type === 'pointerdown' ? 'release' : 'task';
  }
  return {
    type: getEventType(event, interactionType),
    // FFM's own focusout, a trigger guard, the portal's outside guard, or a submenu trigger:
    // focus already moved, and its destination wins even over an explicit `finalFocus`.
    handoff: reason === REASONS.focusOut && isFocusEvent(event),
    moved: !!request.moved,
    suppress:
      (reason === REASONS.triggerHover && event.type === 'mouseleave') ||
      // A sibling menu opened and its initial focus owns focus.
      reason === REASONS.siblingOpen ||
      (outsidePress &&
        !details.nested &&
        !isVirtualClick(event as MouseEvent) &&
        !isVirtualPointerEvent(event as PointerEvent) &&
        !preventScroll()),
    settle,
  };
}

// The focused-before history shared by every manager: the last resort of the return chain.
const LIST_LIMIT = 20;
let previouslyFocusedElements: WeakRef<Element>[] = [];

export function clearDisconnectedPreviouslyFocusedElements() {
  previouslyFocusedElements = previouslyFocusedElements.filter((entry) => {
    return entry.deref()?.isConnected;
  });
}

export function addPreviouslyFocusedElement(element: Element | null | undefined) {
  clearDisconnectedPreviouslyFocusedElements();
  if (element && !isBody(element)) {
    previouslyFocusedElements.push(new WeakRef(element));
    if (previouslyFocusedElements.length > LIST_LIMIT) {
      previouslyFocusedElements = previouslyFocusedElements.slice(-LIST_LIMIT);
    }
  }
}

// A return target must be focusable now: connected, and not inside a closing (inert) popup.
function isUsableReturnElement(element: Element | null | undefined): element is Element {
  return !!element?.isConnected && !closest(element, '[inert]');
}

export function getPreviouslyFocusedElement(usableOnly?: boolean) {
  clearDisconnectedPreviouslyFocusedElements();
  for (let i = previouslyFocusedElements.length - 1; i >= 0; i -= 1) {
    const element = previouslyFocusedElements[i].deref();
    if (!usableOnly || isUsableReturnElement(element)) {
      return element;
    }
  }
  return undefined;
}

function getFirstTabbableElement(container: Element | null) {
  if (!container) {
    return null;
  }

  if (isTabbable(container)) {
    return container;
  }

  return tabbable(container)[0] || container;
}

/**
 * The session's default target: its usable reference or focused-before element, else the closed
 * ancestor's target. A closing descendant reaches it through the parent link.
 */
export function getDefaultReturnTarget(session: ReturnFocusSession): Element | null {
  const { reference, before } = session;
  const referenceTarget = isUsableReturnElement(reference) ? reference : null;
  const beforeTarget = isUsableReturnElement(before) && !isBody(before) ? before : null;

  return (
    (session.preferBefore ? beforeTarget || referenceTarget : referenceTarget || beforeTarget) ||
    session.parent?.current?.() ||
    null
  );
}

/**
 * The element `returnFocus` resolves to, falling back to the session's default target and then
 * the focused-before history. Usable targets only.
 */
export function getReturnTarget(
  session: ReturnFocusSession,
  returnFocus: FloatingFocusManagerProps['returnFocus'],
  closeType: InteractionType,
): Element | null {
  let resolved = typeof returnFocus === 'function' ? returnFocus(closeType) : returnFocus;

  // `null` should fallback to default behavior in case of an empty ref.
  if (resolved === undefined || resolved === false) {
    return null;
  }

  if (resolved === null) {
    resolved = true;
  }

  const defaultTarget =
    getDefaultReturnTarget(session) || getPreviouslyFocusedElement(true) || null;

  if (typeof resolved === 'boolean') {
    return defaultTarget;
  }

  const explicitTarget = resolveRef(resolved);
  return (isUsableReturnElement(explicitTarget) ? explicitTarget : null) || defaultTarget;
}

/**
 * Decides what the return does once the close has committed and an outside press has settled.
 * The facts are positional to keep the call cheap; they are sampled when the return runs, except
 * those taken at the close.
 *
 * @param session What the manager knew when its popup opened.
 * @param intent What the close meant; `null` without a request.
 * @param returnFocus The `returnFocus` value when the popup closed.
 * @param explicit Whether `returnFocus` is an explicit consumer target. Inferred from its type
 *   when undefined.
 * @param activeEl The focused element.
 * @param ownsFocus Whether `activeEl` is in this popup's floating tree.
 * @param ownedFocusAtClose Whether focus was in the floating tree when the close committed,
 *   before a same-commit removal could drop it on the body.
 * @param open Whether the popup has opened again.
 * @param webkit Whether the engine is WebKit.
 */
export function getReturnFocusAction(
  session: ReturnFocusSession,
  intent: CloseIntent | null,
  returnFocus: FloatingFocusManagerProps['returnFocus'],
  explicit: boolean | undefined,
  activeEl: Element | null,
  ownsFocus: boolean,
  ownedFocusAtClose: boolean,
  open: boolean,
  webkit = platform.engine.webkit,
): ReturnFocusAction {
  // The popup reopened while an outside press settled: the new session owns focus.
  if (intent?.settle && open) {
    return null;
  }

  const atBody = isBody(activeEl);
  // A same-commit removal drops focus on body; the close's snapshot still knows it was ours.
  const inside = ownsFocus || (atBody && ownedFocusAtClose);
  const closeType = intent?.type ?? '';
  // The return element if it is tabbable, otherwise its first tabbable child,
  // otherwise the return element itself (which may not be tabbable at all).
  const target = getFirstTabbableElement(getReturnTarget(session, returnFocus, closeType));
  const isExplicit = explicit ?? typeof returnFocus !== 'boolean';

  // `returnFocus={false}` resolves to no target.
  if (
    isHTMLElement(target) &&
    !intent?.suppress &&
    // The user or a guard moved focus away; respect it unless focus has come back inside.
    !(intent?.handoff && (!inside || !intent.moved)) &&
    (session.managed || inside) &&
    // If the focus moved somewhere else after mount, avoid returning focus
    // since it likely entered a different element which should be
    // respected: https://github.com/floating-ui/floating-ui/issues/2607
    (!isExplicit && target !== activeEl && !atBody ? inside : true) &&
    // Another modal popup opened in the same interaction (e.g. a menu item opening a dialog)
    // has hidden the target from assistive tech; its initial focus owns focus now. Not when
    // this popup reopened: its own outside hiding mustn't cancel the close's return.
    (isExplicit || open || !closest(target, '[aria-hidden="true"]'))
  ) {
    const options: FocusOptions = { preventScroll: true };
    if (closeType === 'keyboard') {
      options.focusVisible = true;
    }
    return [target, options];
  }

  // Safari may randomly scroll to the bottom of the page if an input inside a popup has
  // focus when the popup unmounts from the DOM.
  if (webkit && inside && !open && isHTMLElement(activeEl) && isTypeableElement(activeEl)) {
    return [activeEl];
  }

  return null;
}
