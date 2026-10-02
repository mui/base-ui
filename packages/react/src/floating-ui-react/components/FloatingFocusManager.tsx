'use client';
import * as React from 'react';
import { getNodeName, isHTMLElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout, Timeout } from '@base-ui/utils/useTimeout';
import { platform } from '@base-ui/utils/platform';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { FocusGuard } from '../../utils/FocusGuard';
import {
  activeElement,
  closest,
  contains,
  getTarget,
  isTypeableCombobox,
  getFloatingFocusElement,
  isTypeableElement,
} from '../utils/element';
import { isVirtualClick, isVirtualPointerEvent, stopEvent } from '../utils/event';
import {
  tabbable,
  focusable,
  isOutsideEvent,
  isTabbable,
  getNextTabbable,
  getPreviousTabbable,
} from '../utils/tabbable';
import type { FocusableElement } from '../utils/tabbable';
import { getNodeAncestors, getNodeChildren } from '../utils/nodes';
import { isElementVisible } from '../utils/composite';
import type { ContextData, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { createAttribute } from '../utils/createAttribute';
import { enqueueFocus } from '../utils/enqueueFocus';
import { markOthers } from '../utils/markOthers';
import { usePortalContext } from './FloatingPortal';
import { useFloatingTree } from './FloatingTree';
import type { FloatingTreeStore } from '../components/FloatingTreeStore';
import { CLICK_TRIGGER_IDENTIFIER } from '../../internals/constants';
import { resolveRef } from '../../utils/resolveRef';

interface CloseIntent {
  /** The request's event. */
  event: Event;
  /** `focusVisible` on return iff 'keyboard'. */
  type: InteractionType;
  /**
   * Focus was moved away by the user or a guard. Applies while focus is outside, or hasn't moved
   * since the request.
   */
  handoff: boolean;
  /** Focus moved (`focusin`) after the request was made. */
  moved: boolean;
  /** Hover-leave, sibling open, or an outside press without `preventScroll`: never return. */
  suppress: boolean;
  /** An outside press: decide after the press settles. */
  outsidePress: boolean;
}

function isFocusEvent(event: Event) {
  return event instanceof ownerWindow(getTarget(event)).FocusEvent;
}

// Calls `callback` once the press in progress is released. The next press, key or window blur
// also resolve it, so a lost `pointerup` can't strand the return.
function waitForPointerRelease(doc: Document, callback: () => void) {
  const cleanup = mergeCleanups(
    addEventListener(doc, 'pointerup', resolve, true),
    addEventListener(doc, 'pointercancel', resolve, true),
    addEventListener(doc, 'pointerdown', resolve, true),
    addEventListener(doc, 'keydown', resolve, true),
    addEventListener(ownerWindow(doc), 'blur', resolve),
  );
  function resolve() {
    cleanup();
    callback();
  }
}

// On outside press, only return focus to the reference when the browser supports the
// `focus({ preventScroll })` option; without it, restoring focus scrolls the page.
// Chrome on Android and Samsung Internet still don't support `preventScroll`
// (https://issues.chromium.org/issues/41453122).
// Not cached: tests stub `HTMLElement.prototype.focus` per test to toggle support.
function isPreventScrollSupported(doc: Document) {
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

const LIST_LIMIT = 20;
let previouslyFocusedElements: WeakRef<Element>[] = [];

function clearDisconnectedPreviouslyFocusedElements() {
  previouslyFocusedElements = previouslyFocusedElements.filter((entry) => {
    return entry.deref()?.isConnected;
  });
}

function addPreviouslyFocusedElement(element: Element | null | undefined) {
  clearDisconnectedPreviouslyFocusedElements();
  if (element && getNodeName(element) !== 'body') {
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

function getPreviouslyFocusedElement(usableOnly?: boolean) {
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
 * An ancestor focus manager's return target once its popup has closed. A nested popup falls back
 * to it when its own targets sit inside the closing ancestor (inert) or are gone, so focus follows
 * the popup hierarchy rather than the global focus history.
 */
const ClosedReturnTargetContext = React.createContext<React.RefObject<
  (() => Element | null) | null
> | null>(null);

function handleTabIndex(floatingFocusElement: HTMLElement) {
  if (
    floatingFocusElement.hasAttribute('tabindex') &&
    !floatingFocusElement.hasAttribute('data-tabindex')
  ) {
    return;
  }

  if (!floatingFocusElement.getAttribute('role')?.includes('dialog')) {
    return;
  }

  const focusableElements = focusable(floatingFocusElement);
  const tabbableContent = focusableElements.filter((element) => {
    const dataTabIndex = element.getAttribute('data-tabindex') || '';
    return (
      isTabbable(element) ||
      (element.hasAttribute('data-tabindex') && !dataTabIndex.startsWith('-'))
    );
  });
  const tabIndex = floatingFocusElement.getAttribute('tabindex');

  if (tabbableContent.length === 0) {
    if (tabIndex !== '0') {
      floatingFocusElement.setAttribute('tabindex', '0');
      // Mark our own write so the externally-managed early-return above doesn't
      // mistake it for a user-authored `tabindex` and freeze management.
      floatingFocusElement.setAttribute('data-tabindex', '0');
    }
  } else if (
    tabIndex !== '-1' ||
    (floatingFocusElement.hasAttribute('data-tabindex') &&
      floatingFocusElement.getAttribute('data-tabindex') !== '-1')
  ) {
    floatingFocusElement.setAttribute('tabindex', '-1');
    floatingFocusElement.setAttribute('data-tabindex', '-1');
  }
}

export interface FloatingFocusManagerProps {
  children: React.JSX.Element;
  /**
   * The floating context returned from `useFloatingRootContext`.
   */
  context: FloatingRootContext;
  /**
   * The interaction type used to open the floating element.
   */
  openInteractionType?: InteractionType | null | undefined;
  /**
   * Whether or not the focus manager should be disabled. Useful to delay focus
   * management until after a transition completes or some other conditional
   * state.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Determines the element to focus when the floating element is opened.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (first tabbable element or floating element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use default behavior, `null` to fallback to default behavior,
   *   or `false`/`undefined` to do nothing.
   * @default true
   */
  initialFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((openType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
  /**
   * Determines the element to focus when the floating element is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (reference or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, `null` to fallback to default behavior,
   *   or `false`/`undefined` to do nothing.
   * @default true
   */
  returnFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((closeType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
  /**
   * Whether `returnFocus` is an explicit consumer target. Internal dynamic defaults use `false`
   * so focus that has already moved outside the floating tree is respected.
   * @internal
   */
  explicitReturnFocus?: boolean | undefined;
  /**
   * Determines where focus should be restored if focus inside the floating element is lost
   * (such as due to the removal of the currently focused element from the DOM).
   *
   * - `true`: restore to the nearest tabbable element inside the floating tree (previous
   *   tabbable if possible, otherwise the last tabbable, then the floating element itself)
   * - `'popup'`: restore directly to the floating element (container) itself
   * - `false`: do not restore focus
   * @default false
   */
  restoreFocus?: boolean | 'popup' | undefined;
  /**
   * Determines if focus is “modal”, meaning focus is fully trapped inside the
   * floating element and outside content cannot be accessed. This includes
   * screen reader virtual cursors.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * Determines whether `focusout` event listeners that control whether the
   * floating element should be closed if the focus moves outside of it are
   * attached to the reference and floating elements. This affects non-modal
   * focus management.
   * @default true
   */
  closeOnFocusOut?: boolean | undefined;
  /**
   * Overrides the element to focus when tabbing forward out of the floating element.
   */
  nextFocusableElement?: HTMLElement | React.RefObject<HTMLElement | null> | null | undefined;
  /**
   * Overrides the element to focus when tabbing backward out of the floating element.
   */
  previousFocusableElement?: HTMLElement | React.RefObject<HTMLElement | null> | null | undefined;
  /**
   * Ref to the focus guard preceding the floating element content.
   * Can be useful to focus the popup programmatically.
   */
  beforeContentFocusGuardRef?: React.RefObject<HTMLSpanElement | null> | undefined;
  /**
   * External FloatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore | undefined;
  /**
   * Additional elements that should be treated as part of the floating subtree
   * even if they are rendered outside the floating element itself.
   */
  getInsideElements?: (() => Array<Element | null | undefined>) | undefined;
}

/**
 * Provides focus management for the floating element.
 * @see https://floating-ui.com/docs/FloatingFocusManager
 * @internal
 */
export function FloatingFocusManager(props: FloatingFocusManagerProps): React.JSX.Element {
  const {
    context: store,
    children,
    disabled = false,
    initialFocus = true,
    returnFocus = true,
    explicitReturnFocus,
    restoreFocus = false,
    modal = true,
    closeOnFocusOut = true,
    openInteractionType = '',
    nextFocusableElement,
    previousFocusableElement,
    beforeContentFocusGuardRef,
    externalTree,
    getInsideElements,
  } = props;

  const open = store.useState('open');
  const domReference = store.useState('domReferenceElement');
  const floating = store.useState('floatingElement');

  const { dataRef } = store.context;

  const getNodeId = useStableCallback(() => dataRef.current.floatingContext?.nodeId);

  const ignoreInitialFocus = initialFocus === false;
  // A typeable combobox reference (e.g. input/textarea) with `initialFocus={false}`
  // has different focus semantics: focus is not trapped inside the floating element,
  // so in the modal case the guards are not rendered, but `aria-hidden` is still
  // applied to the outside nodes.
  const isUntrappedTypeableCombobox = isTypeableCombobox(domReference) && ignoreInitialFocus;

  const initialFocusRef = useValueAsRef(initialFocus);
  const returnFocusRef = useValueAsRef(returnFocus);
  // Read through a ref so a mid-open change can't re-run the return-focus effect, whose cleanup
  // would move focus while the floating element is still open.
  const explicitReturnFocusRef = useValueAsRef(explicitReturnFocus);
  const openInteractionTypeRef = useValueAsRef(openInteractionType);
  const openRef = useValueAsRef(open);

  const tree = useFloatingTree(externalTree);
  const portalContext = usePortalContext();
  const parentClosedReturnTargetRef = React.useContext(ClosedReturnTargetContext);
  // This popup's default target once it has closed (set by the close), for descendants.
  const closedReturnTargetRef = React.useRef<(() => Element | null) | null>(null);

  const isPointerDownRef = React.useRef(false);
  const pointerDownOutsideRef = React.useRef(false);
  const lastFocusedTabbableRef = React.useRef<FocusableElement | null>(null);
  // Whether a pointer is pressed, on any target. Used to let an outside press settle.
  const pointerPressedRef = React.useRef(false);
  // The close request that was pending when focus last moved (`focusin`).
  const focusMovedAfterRequestRef = React.useRef<ContextData['closeRequest']>(undefined);
  const lastInteractionTypeRef = React.useRef<InteractionType>('');

  const beforeGuardRef = React.useRef<HTMLSpanElement | null>(null);
  const afterGuardRef = React.useRef<HTMLSpanElement | null>(null);

  const mergedBeforeGuardRef = useMergedRefs(
    beforeGuardRef,
    beforeContentFocusGuardRef,
    portalContext?.beforeInsideRef,
  );
  const mergedAfterGuardRef = useMergedRefs(afterGuardRef, portalContext?.afterInsideRef);

  const blurTimeout = useTimeout();
  const pointerDownTimeout = useTimeout();
  const restoreFocusFrame = useAnimationFrame();

  const isInsidePortal = portalContext != null;
  const active = open && !disabled;
  const floatingFocusElement = getFloatingFocusElement(floating);

  const getTabbableContent = useStableCallback(
    (container: Element | null = floatingFocusElement) => {
      return container ? tabbable(container) : [];
    },
  );

  const getResolvedInsideElements = useStableCallback(
    () => getInsideElements?.().filter((element): element is Element => element != null) ?? [],
  );

  // Prevent Tab from escaping the modal when there are no tabbable elements.
  React.useEffect(() => {
    if (!active || !modal) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        // The focus guards have nothing to focus, so we need to stop the event.
        if (
          contains(floatingFocusElement, activeElement(ownerDocument(floatingFocusElement))) &&
          getTabbableContent().length === 0 &&
          !isUntrappedTypeableCombobox
        ) {
          stopEvent(event);
        }
      }
    }

    const doc = ownerDocument(floatingFocusElement);
    return addEventListener(doc, 'keydown', onKeyDown);
  }, [active, floatingFocusElement, modal, isUntrappedTypeableCombobox, getTabbableContent]);

  // Track pointer/keyboard interactions to disambiguate focus and outside presses, and expire a
  // close intent on the next input. Gated on `open` only so passive sessions are covered too.
  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const doc = ownerDocument(floatingFocusElement);

    function clearPointerDownOutside() {
      pointerDownOutsideRef.current = false;
    }

    function onPointerUp() {
      pointerPressedRef.current = false;
      clearPointerDownOutside();
    }

    // The next input invalidates a close request it didn't make (e.g. a refused one).
    function invalidateCloseRequest(event: Event) {
      if (dataRef.current.closeRequest?.nativeEvent !== event) {
        dataRef.current.closeRequest = undefined;
      }
    }

    function onPointerDown(event: PointerEvent) {
      invalidateCloseRequest(event);
      pointerPressedRef.current = true;
      const target = getTarget(event) as Element | null;
      const insideElements = getResolvedInsideElements();
      const pointerTargetInside =
        contains(floating, target) ||
        contains(domReference, target) ||
        contains(portalContext?.portalNode, target) ||
        insideElements.some((element) => element === target || contains(element, target));
      pointerDownOutsideRef.current = !pointerTargetInside;
      lastInteractionTypeRef.current =
        (event.pointerType as React.PointerEvent['pointerType']) || 'keyboard';

      if (closest(target, `[${CLICK_TRIGGER_IDENTIFIER}]`)) {
        isPointerDownRef.current = true;
        // Reset on the next tick so a single click on a click-trigger doesn't
        // permanently suppress focus-out closing for the lifetime of the instance.
        pointerDownTimeout.start(0, () => {
          isPointerDownRef.current = false;
        });
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      invalidateCloseRequest(event);
      lastInteractionTypeRef.current = 'keyboard';
    }

    return mergeCleanups(
      addEventListener(doc, 'pointerdown', onPointerDown, true),
      addEventListener(doc, 'pointerup', onPointerUp, true),
      addEventListener(doc, 'pointercancel', onPointerUp, true),
      addEventListener(doc, 'keydown', onKeyDown, true),
      addEventListener(
        doc,
        'focusin',
        () => {
          focusMovedAfterRequestRef.current = dataRef.current.closeRequest;
        },
        true,
      ),
      // Avoid a stale `true` leaking into the next open (e.g. keep-mounted popups)
      // if the popup dismissed between pointerdown and pointerup.
      clearPointerDownOutside,
    );
  }, [
    floating,
    domReference,
    floatingFocusElement,
    open,
    portalContext,
    pointerDownTimeout,
    getResolvedInsideElements,
    dataRef,
  ]);

  // Close on focus out and restore focus within the floating tree when needed.
  React.useEffect(() => {
    if (!active || !closeOnFocusOut) {
      return undefined;
    }

    const doc = ownerDocument(floatingFocusElement);

    // In Safari, buttons lose focus when pressing them.
    function handlePointerDown() {
      isPointerDownRef.current = true;
      pointerDownTimeout.start(0, () => {
        isPointerDownRef.current = false;
      });
    }

    function handleFocusIn(event: FocusEvent) {
      const target = getTarget(event) as FocusableElement | null;
      if (isTabbable(target)) {
        lastFocusedTabbableRef.current = target;
      }
    }

    function handleFocusOutside(event: FocusEvent) {
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      const currentTarget = event.currentTarget;
      const target = getTarget(event) as HTMLElement | null;

      // When focus is lost to the body (e.g. on a backdrop press), record the element that
      // had focus so a confirmation dialog opened while the body is focused can return focus
      // to it. Scoped to `modal` to avoid non-modal popups polluting the shared stack.
      if (modal && relatedTarget == null && target != null && contains(floating, target)) {
        addPreviouslyFocusedElement(target);
      }

      queueMicrotask(() => {
        // A focusout queued before the close commit (e.g. React 17 deferred passive cleanup, or
        // the focusout caused by the return itself) must not act on a closed popup.
        if (!store.select('open')) {
          return;
        }
        const nodeId = getNodeId();
        const triggers = store.context.triggerElements;
        const insideElements = getResolvedInsideElements();
        const isRelatedFocusGuard =
          relatedTarget?.hasAttribute(createAttribute('focus-guard')) &&
          [
            beforeGuardRef.current,
            afterGuardRef.current,
            portalContext?.beforeInsideRef.current,
            portalContext?.afterInsideRef.current,
            portalContext?.beforeOutsideRef.current,
            portalContext?.afterOutsideRef.current,
            resolveRef(previousFocusableElement),
            resolveRef(nextFocusableElement),
          ].includes(relatedTarget);

        const movedToUnrelatedNode = !(
          contains(domReference, relatedTarget) ||
          contains(floating, relatedTarget) ||
          contains(relatedTarget, floating) ||
          contains(portalContext?.portalNode, relatedTarget) ||
          insideElements.some(
            (element) => element === relatedTarget || contains(element, relatedTarget),
          ) ||
          triggers.hasMatchingElement((trigger) => contains(trigger, relatedTarget)) ||
          isRelatedFocusGuard ||
          (tree &&
            (getNodeChildren(tree.nodesRef.current, nodeId).find(
              (node) =>
                contains(node.context?.elements.floating, relatedTarget) ||
                contains(node.context?.elements.domReference, relatedTarget),
            ) ||
              getNodeAncestors(tree.nodesRef.current, nodeId).find(
                (node) =>
                  [
                    node.context?.elements.floating,
                    getFloatingFocusElement(node.context?.elements.floating),
                  ].includes(relatedTarget) ||
                  node.context?.elements.domReference === relatedTarget,
              )))
        );

        if (currentTarget === domReference && floatingFocusElement) {
          handleTabIndex(floatingFocusElement);
        }

        // Restore focus to the previously focused tabbable element to prevent
        // focus from being lost outside the floating tree.
        if (
          restoreFocus &&
          currentTarget !== domReference &&
          !isElementVisible(target) &&
          activeElement(doc) === doc.body
        ) {
          // Let `FloatingPortal` effect knows that focus is still inside the
          // floating tree.
          if (isHTMLElement(floatingFocusElement)) {
            floatingFocusElement.focus();
            // If explicitly requested to restore focus to the popup container, do not search
            // for the next/previous tabbable element.
            if (restoreFocus === 'popup') {
              // If the focused element is removed on pointerdown, the browser
              // tries to move focus to it right after the `.focus()` call above,
              // but because it's removed in the same tick, focus is lost instead.
              // Re-focusing asynchronously (next frame) wins that race.
              restoreFocusFrame.request(() => {
                floatingFocusElement.focus();
              });
              return;
            }
          }

          const tabbableContent = getTabbableContent() as Array<Element | null>;
          const prevTabbable = lastFocusedTabbableRef.current;
          const nodeToFocus =
            (prevTabbable && tabbableContent.includes(prevTabbable) ? prevTabbable : null) ||
            tabbableContent[tabbableContent.length - 1] ||
            floatingFocusElement;

          if (isHTMLElement(nodeToFocus)) {
            nodeToFocus.focus();
          }
        }

        // https://github.com/floating-ui/floating-ui/issues/3060
        if (dataRef.current.insideReactTree) {
          dataRef.current.insideReactTree = false;
          return;
        }

        // Focus did not move inside the floating tree, and there are no tabbable
        // portal guards to handle closing.
        if (
          (isUntrappedTypeableCombobox ? true : !modal) &&
          relatedTarget &&
          movedToUnrelatedNode &&
          !isPointerDownRef.current &&
          // Fix React 18 Strict Mode returnFocus due to double rendering.
          // For an "untrapped" typeable combobox (input role=combobox with
          // initialFocus=false), re-opening the popup and tabbing out should still close it even
          // when the previously focused element (e.g. the next tabbable outside the popup) is
          // focused again. Otherwise, the popup remains open on the second Tab sequence:
          // click input -> Tab (closes) -> click input -> Tab.
          // Allow closing when `isUntrappedTypeableCombobox` regardless of the previously focused element.
          (isUntrappedTypeableCombobox || relatedTarget !== getPreviouslyFocusedElement())
        ) {
          store.setOpen(false, createChangeEventDetails(REASONS.focusOut, event));
        }
      });
    }

    function markInsideReactTree() {
      if (pointerDownOutsideRef.current) {
        return;
      }
      dataRef.current.insideReactTree = true;
      blurTimeout.start(0, () => {
        dataRef.current.insideReactTree = false;
      });
    }

    const domReferenceElement = isHTMLElement(domReference) ? domReference : null;
    if (!floating && !domReferenceElement) {
      return undefined;
    }

    return mergeCleanups(
      domReferenceElement && addEventListener(domReferenceElement, 'focusout', handleFocusOutside),
      domReferenceElement &&
        addEventListener(domReferenceElement, 'pointerdown', handlePointerDown),
      floating && addEventListener(floating, 'focusin', handleFocusIn),
      floating && addEventListener(floating, 'focusout', handleFocusOutside),
      floating &&
        portalContext &&
        addEventListener(floating, 'focusout', markInsideReactTree, true),
    );
  }, [
    active,
    domReference,
    floating,
    floatingFocusElement,
    modal,
    tree,
    portalContext,
    store,
    closeOnFocusOut,
    restoreFocus,
    getTabbableContent,
    isUntrappedTypeableCombobox,
    getNodeId,
    dataRef,
    blurTimeout,
    pointerDownTimeout,
    restoreFocusFrame,
    nextFocusableElement,
    previousFocusableElement,
    getResolvedInsideElements,
  ]);

  // Hide everything outside the floating tree from assistive tech while open.
  // A layout effect so the cleanup at close runs in the commit, before the return-focus job.
  useIsoLayoutEffect(() => {
    if (disabled || !floating || !open) {
      return undefined;
    }

    // Don't hide portals nested within the parent portal.
    const portalNodes = Array.from(
      portalContext?.portalNode?.querySelectorAll(`[${createAttribute('portal')}]`) || [],
    );

    const ancestors = tree ? getNodeAncestors(tree.nodesRef.current, getNodeId()) : [];
    const rootAncestorComboboxDomReference = ancestors.find((node) =>
      isTypeableCombobox(node.context?.elements.domReference || null),
    )?.context?.elements.domReference;

    const controlInsideElements = [
      floating,
      ...portalNodes,
      beforeGuardRef.current,
      afterGuardRef.current,
      portalContext?.beforeOutsideRef.current,
      portalContext?.afterOutsideRef.current,
      ...getResolvedInsideElements(),
    ];
    const insideElements = [
      ...controlInsideElements,
      rootAncestorComboboxDomReference,
      resolveRef(previousFocusableElement),
      resolveRef(nextFocusableElement),
      isUntrappedTypeableCombobox ? domReference : null,
    ].filter((x): x is Element => x != null);

    const ariaHiddenCleanup = markOthers(insideElements, {
      ariaHidden: modal || isUntrappedTypeableCombobox,
      mark: false,
    });

    const markerInsideElements = [floating, ...portalNodes].filter((x): x is Element => x != null);
    const markerCleanup = markOthers(markerInsideElements);

    return () => {
      markerCleanup();
      ariaHiddenCleanup();
    };
  }, [
    open,
    disabled,
    domReference,
    floating,
    modal,
    portalContext,
    isUntrappedTypeableCombobox,
    tree,
    getNodeId,
    nextFocusableElement,
    previousFocusableElement,
    getResolvedInsideElements,
  ]);

  // Focus the initial element when the floating element opens.
  useIsoLayoutEffect(() => {
    if (!open || disabled || !isHTMLElement(floatingFocusElement)) {
      return;
    }

    lastInteractionTypeRef.current = '';

    const doc = ownerDocument(floatingFocusElement);
    const previouslyFocusedElement = activeElement(doc);

    // Wait for any layout effect state setters to execute to set `tabIndex`.
    queueMicrotask(() => {
      const initialFocusValueOrFn = initialFocusRef.current;
      const resolvedInitialFocus =
        typeof initialFocusValueOrFn === 'function'
          ? initialFocusValueOrFn(openInteractionTypeRef.current || '')
          : initialFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedInitialFocus === undefined || resolvedInitialFocus === false) {
        return;
      }

      const focusAlreadyInsideFloatingEl = contains(floatingFocusElement, previouslyFocusedElement);

      if (focusAlreadyInsideFloatingEl) {
        return;
      }

      let focusableElements: Array<FocusableElement> | null = null;
      const getDefaultFocusElement = () => {
        if (focusableElements == null) {
          focusableElements = getTabbableContent(floatingFocusElement);
        }

        return focusableElements[0] || floatingFocusElement;
      };

      let elToFocus: FocusableElement | null | undefined;
      if (resolvedInitialFocus === true || resolvedInitialFocus === null) {
        elToFocus = getDefaultFocusElement();
      } else {
        elToFocus = resolveRef(resolvedInitialFocus);
      }
      elToFocus = elToFocus || getDefaultFocusElement();

      const hadFocusInside = contains(floatingFocusElement, activeElement(doc));
      const closeRequestAtSchedule = dataRef.current.closeRequest;

      // Screen readers re-sync focus to their cursor right after a synthesized press. A focus
      // that lands a frame later reads as a stray move and gets pulled back to the reference.
      const openEvent = dataRef.current.openEvent;
      const openedByVirtualPress =
        openEvent?.type === 'mousedown' && isVirtualClick(openEvent as MouseEvent);

      // enqueueFocus returns a rAF-cancel function; we intentionally don't cancel this focus.
      void enqueueFocus(elToFocus, {
        sync: openedByVirtualPress,
        preventScroll: elToFocus === floatingFocusElement,
        shouldFocus() {
          // If the floating element has closed before this runs — e.g. tabbing out of a
          // kept-mounted popup — don't pull focus back onto the initial element after it has
          // legitimately moved elsewhere.
          if (!openRef.current) {
            return false;
          }

          // A close requested since this was scheduled owns focus now, even before it commits.
          const closeRequest = dataRef.current.closeRequest;
          if (closeRequest && closeRequest !== closeRequestAtSchedule) {
            return false;
          }

          if (hadFocusInside) {
            return true;
          }

          const currentActiveElement = activeElement(doc);
          const focusMovedInside =
            currentActiveElement !== elToFocus &&
            contains(floatingFocusElement, currentActiveElement);

          return !focusMovedInside;
        },
      });
    });
  }, [
    disabled,
    open,
    floatingFocusElement,
    getTabbableContent,
    initialFocusRef,
    openInteractionTypeRef,
    openRef,
    dataRef,
  ]);

  // Derives the close intent from the store's close request (or the close's own snapshot of it),
  // and consumes the request.
  const takeCloseIntent = useStableCallback(
    (doc: Document, fallback: ContextData['closeRequest']): CloseIntent | null => {
      const details = dataRef.current.closeRequest ?? fallback;
      dataRef.current.closeRequest = undefined;
      if (!details) {
        return null;
      }
      const event = details.nativeEvent;
      const reason = details.reason;
      return {
        event,
        type: getEventType(event, lastInteractionTypeRef.current),
        // FFM's own focusout, a trigger guard, the portal's outside guard, or a submenu trigger:
        // focus already moved, and its destination wins even over an explicit `finalFocus`.
        handoff: reason === REASONS.focusOut && isFocusEvent(event),
        moved: focusMovedAfterRequestRef.current === details,
        suppress:
          (reason === REASONS.triggerHover && event.type === 'mouseleave') ||
          // A sibling menu opened and its initial focus owns focus.
          reason === REASONS.siblingOpen ||
          (reason === REASONS.outsidePress &&
            !details.nested &&
            !isVirtualClick(event as MouseEvent) &&
            !isVirtualPointerEvent(event as PointerEvent) &&
            !isPreventScrollSupported(doc)),
        // An outside press closes before the press is done moving focus: a sloppy press before
        // its default focus, an intentional one before the pressed element's own click handlers.
        outsidePress: reason === REASONS.outsidePress,
      };
    },
  );

  // A return-focus queued by the effect cleanup. If the effect re-arms in the same commit, a
  // dependency changed while the popup stayed open, so the cleanup was not a close.
  const pendingReturnFocusRef = React.useRef<{ cancelled: boolean } | null>(null);

  // Track return focus targets and restore focus when the floating element closes.
  useIsoLayoutEffect(() => {
    if (!open || !floatingFocusElement) {
      pendingReturnFocusRef.current = null;
      return undefined;
    }

    if (pendingReturnFocusRef.current) {
      pendingReturnFocusRef.current.cancelled = true;
      pendingReturnFocusRef.current = null;
    } else {
      // A new session: a request made before it belongs to an earlier one (its job keeps a
      // snapshot).
      dataRef.current.closeRequest = undefined;
    }

    const doc = ownerDocument(floatingFocusElement);
    const elementFocusedBeforeOpen = activeElement(doc);
    pointerPressedRef.current = false;
    // Only an explicit `null` interaction type represents a programmatic open.
    // `undefined` is normalized to `''` by the prop default, so it never reaches
    // here as nullish and is intentionally not treated as programmatic.
    const preferPreviousFocus = openInteractionTypeRef.current == null;
    // False only while the manager is disabled for this open cycle (Popover hover-open).
    const managed = !disabled;

    addPreviouslyFocusedElement(elementFocusedBeforeOpen);

    // Usable targets only: the reference or the element focused before open, else a closed
    // ancestor's target.
    function getDefaultReturnElement() {
      const referenceReturnElement = isUsableReturnElement(domReference) ? domReference : null;
      const previousReturnElement =
        isUsableReturnElement(elementFocusedBeforeOpen) &&
        getNodeName(elementFocusedBeforeOpen) !== 'body'
          ? elementFocusedBeforeOpen
          : null;

      return (
        (preferPreviousFocus
          ? previousReturnElement || referenceReturnElement
          : referenceReturnElement || previousReturnElement) ||
        parentClosedReturnTargetRef?.current?.() ||
        null
      );
    }
    closedReturnTargetRef.current = null;

    function getReturnElement(
      returnFocusValueOrFn: FloatingFocusManagerProps['returnFocus'],
      closeType: InteractionType,
    ) {
      let resolvedReturnFocusValue =
        typeof returnFocusValueOrFn === 'function'
          ? returnFocusValueOrFn(closeType)
          : returnFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedReturnFocusValue === undefined || resolvedReturnFocusValue === false) {
        return null;
      }

      if (resolvedReturnFocusValue === null) {
        resolvedReturnFocusValue = true;
      }

      const defaultReturnElement =
        getDefaultReturnElement() || getPreviouslyFocusedElement(true) || null;

      if (typeof resolvedReturnFocusValue === 'boolean') {
        return defaultReturnElement;
      }

      const explicitReturnElement = resolveRef(resolvedReturnFocusValue);
      return (
        (isUsableReturnElement(explicitReturnElement) ? explicitReturnElement : null) ||
        defaultReturnElement ||
        null
      );
    }

    function isOwnFocus(activeEl: Element | null) {
      const insideElements = getResolvedInsideElements();
      return (
        contains(floating, activeEl) ||
        insideElements.some((element) => element === activeEl || contains(element, activeEl)) ||
        (tree &&
          getNodeChildren(tree.nodesRef.current, getNodeId(), false).some((node) =>
            contains(node.context?.elements.floating, activeEl),
          ))
      );
    }

    function runReturn(
      intent: CloseIntent | null,
      returnFocusValueOrFn: FloatingFocusManagerProps['returnFocus'],
      insideAtCleanup: boolean | null,
    ) {
      const activeEl = activeElement(doc);
      // A same-commit removal drops focus on body; the cleanup's snapshot still knows it was ours.
      const inside = isOwnFocus(activeEl) || (activeEl === doc.body && insideAtCleanup);
      const closeType = intent?.type ?? '';
      // The return element if it is tabbable, otherwise its first tabbable child,
      // otherwise the return element itself (which may not be tabbable at all).
      const tabbableReturnElement = getFirstTabbableElement(
        getReturnElement(returnFocusValueOrFn, closeType),
      );
      const hasExplicitReturnFocus =
        explicitReturnFocusRef.current ?? typeof returnFocusValueOrFn !== 'boolean';

      if (
        returnFocusValueOrFn &&
        isHTMLElement(tabbableReturnElement) &&
        !intent?.suppress &&
        // The user or a guard moved focus away; respect it unless focus has come back inside.
        !(intent?.handoff && (!inside || !intent.moved)) &&
        (managed || inside) &&
        // If the focus moved somewhere else after mount, avoid returning focus
        // since it likely entered a different element which should be
        // respected: https://github.com/floating-ui/floating-ui/issues/2607
        (!hasExplicitReturnFocus && tabbableReturnElement !== activeEl && activeEl !== doc.body
          ? inside
          : true) &&
        // Another modal popup opened in the same interaction (e.g. a menu item opening a dialog)
        // has hidden the target from assistive tech; its initial focus owns focus now. Not when
        // this popup reopened: its own outside hiding mustn't cancel the close's return.
        (hasExplicitReturnFocus ||
          store.select('open') ||
          !closest(tabbableReturnElement, '[aria-hidden="true"]'))
      ) {
        const focusOptions: FocusOptions = { preventScroll: true };
        if (closeType === 'keyboard') {
          focusOptions.focusVisible = true;
        }
        tabbableReturnElement.focus(focusOptions);
      } else if (
        platform.engine.webkit &&
        inside &&
        !store.select('open') &&
        isHTMLElement(activeEl) &&
        isTypeableElement(activeEl)
      ) {
        // Safari may randomly scroll to the bottom of the page if an input inside a popup has
        // focus when the popup unmounts from the DOM.
        activeEl.blur();
      }
    }

    return () => {
      // Before a same-commit deletion removes the DOM.
      const insideAtCleanup = isOwnFocus(activeElement(doc));
      // E2 removes its listeners in its passive cleanup, which runs after this layout cleanup.
      const pressed = pointerPressedRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const returnFocusValueOrFn = returnFocusRef.current;
      // This close's request, unless it is dispatched after the commit (consumer `flushSync`).
      // Read in the cleanup on purpose: it's the request at the moment the popup closed.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const requestAtCleanup = dataRef.current.closeRequest;
      closedReturnTargetRef.current = getDefaultReturnElement;

      const job = { cancelled: false };
      pendingReturnFocusRef.current = job;

      queueMicrotask(() => {
        if (job.cancelled) {
          return;
        }
        // Read when the job runs: a consumer's `flushSync` inside `onOpenChange` commits the
        // close before the store records the request. Fall back to the cleanup's snapshot: a
        // reopen committed since then (e.g. `handle.open()` in a layout effect) started a new
        // session, which cleared it.
        const intent = takeCloseIntent(doc, requestAtCleanup);
        const run = () => runReturn(intent, returnFocusValueOrFn, insideAtCleanup);

        if (!intent?.outsidePress) {
          run();
          return;
        }

        // Let the press land first: mousedown's default focus, then a `<label>`/onclick focus on
        // click. The next press or key may reopen the popup first; the new session owns focus then.
        // Not `useTimeout`: the deferred return must survive this component unmounting, which a
        // non-animated popup does in the same flush as its close.
        const settle = () =>
          Timeout.create().start(0, () => {
            if (!store.select('open')) {
              run();
            }
          });
        // Only a close made by the press itself (sloppy mouse `pointerdown`) has a release to wait
        // for. Touch closes on `touchend`/compatibility `mousedown`, after `pointerup`.
        if (pressed && intent.event.type === 'pointerdown') {
          waitForPointerRelease(doc, settle);
        } else {
          settle();
        }
      });
    };
  }, [
    open,
    disabled,
    floating,
    floatingFocusElement,
    returnFocusRef,
    explicitReturnFocusRef,
    openInteractionTypeRef,
    tree,
    domReference,
    getNodeId,
    getResolvedInsideElements,
    store,
    takeCloseIntent,
    parentClosedReturnTargetRef,
    dataRef,
  ]);

  // Synchronize the focus manager state (modal, closeOnFocusOut, open, etc.) to the
  // FloatingPortal context, which uses it to decide whether to render its own guards.
  useIsoLayoutEffect(() => {
    if (disabled || !portalContext) {
      return undefined;
    }

    portalContext.setFocusManagerState({
      modal,
      closeOnFocusOut,
      open,
      onOpenChange: store.setOpen,
      domReference,
    });

    return () => {
      portalContext.setFocusManagerState(null);
    };
  }, [disabled, portalContext, modal, open, store, closeOnFocusOut, domReference]);

  // Keep the floating element tabIndex in sync and clear stale focus records.
  useIsoLayoutEffect(() => {
    if (disabled || !floatingFocusElement) {
      return undefined;
    }
    handleTabIndex(floatingFocusElement);
    return () => {
      queueMicrotask(clearDisconnectedPreviouslyFocusedElements);
    };
  }, [disabled, floatingFocusElement]);

  const shouldRenderGuards =
    active && (modal ? !isUntrappedTypeableCombobox : true) && (isInsidePortal || modal);

  return (
    <ClosedReturnTargetContext.Provider value={closedReturnTargetRef}>
      {shouldRenderGuards && (
        <FocusGuard
          data-type="inside"
          ref={mergedBeforeGuardRef}
          onFocus={(event) => {
            if (modal) {
              const els = getTabbableContent();
              // enqueueFocus returns a rAF-cancel function we don't need here.
              void enqueueFocus(els[els.length - 1]);
            } else if (portalContext?.portalNode) {
              if (isOutsideEvent(event, portalContext.portalNode)) {
                const nextTabbable = getNextTabbable(domReference);
                nextTabbable?.focus();
              } else {
                resolveRef(previousFocusableElement ?? portalContext.beforeOutsideRef)?.focus();
              }
            }
          }}
        />
      )}
      {children}
      {shouldRenderGuards && (
        <FocusGuard
          data-type="inside"
          ref={mergedAfterGuardRef}
          onFocus={(event) => {
            if (modal) {
              // enqueueFocus returns a rAF-cancel function we don't need here.
              void enqueueFocus(getTabbableContent()[0]);
            } else if (portalContext?.portalNode) {
              if (isOutsideEvent(event, portalContext.portalNode)) {
                const prevTabbable = getPreviousTabbable(domReference);
                prevTabbable?.focus();
              } else {
                resolveRef(nextFocusableElement ?? portalContext.afterOutsideRef)?.focus();
              }
            }
          }}
        />
      )}
    </ClosedReturnTargetContext.Provider>
  );
}
