'use client';
import * as React from 'react';
import { getNodeName, isHTMLElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { platform } from '@base-ui/utils/platform';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { FocusGuard } from '../../utils/FocusGuard';
import {
  activeElement,
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
  type FocusableElement,
} from '../utils/tabbable';
import { getNodeAncestors, getNodeChildren } from '../utils/nodes';
import { isElementVisible } from '../utils/composite';
import type { FloatingContext, FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { createAttribute } from '../utils/createAttribute';
import { enqueueFocus } from '../utils/enqueueFocus';
import { markOthers } from '../utils/markOthers';
import { usePortalContext } from './FloatingPortal';
import { useFloatingTree } from './FloatingTree';
import { FloatingTreeStore } from '../components/FloatingTreeStore';
import { CLICK_TRIGGER_IDENTIFIER } from '../../internals/constants';
import { FloatingUIOpenChangeDetails } from '../../internals/types';
import { resolveRef } from '../../utils/resolveRef';

function getEventType(event: Event, lastInteractionType?: InteractionType): InteractionType {
  const win = ownerWindow(getTarget(event));
  if (event instanceof win.KeyboardEvent) {
    return 'keyboard';
  }
  if (event instanceof win.FocusEvent) {
    // Focus events can be caused by a preceding pointer interaction (e.g., focusout on outside press).
    // Prefer the last known pointer type if provided, else treat as keyboard.
    return lastInteractionType || 'keyboard';
  }
  if ('pointerType' in event) {
    return (event.pointerType as React.PointerEvent['pointerType']) || 'keyboard';
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
 * State scoped to a single open interval of the floating element.
 */
interface FocusSession {
  /** What was focused just before the popup opened, captured once per session. */
  elementFocusedBeforeOpen: Element | null;
  /** Whether a programmatic open should prefer the previously focused element over the trigger. */
  preferPreviousFocus: boolean;
  /** Set by the close paths that must not pull focus back (focus-out, hover-leave, outside press). */
  preventReturnFocus: boolean;
  /** How this session was closed, used to decide `focusVisible`. */
  closeType: InteractionType;
}

interface PendingReturn {
  session: FocusSession;
  run: () => void;
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

function getPreviouslyFocusedElement() {
  clearDisconnectedPreviouslyFocusedElements();
  return previouslyFocusedElements[previouslyFocusedElements.length - 1]?.deref();
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
  context: FloatingRootContext | FloatingContext;
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
    context,
    children,
    disabled = false,
    initialFocus = true,
    returnFocus = true,
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

  const store = 'rootStore' in context ? context.rootStore : context;

  const open = store.useState('open');
  const domReference = store.useState('domReferenceElement');
  const floating = store.useState('floatingElement');
  const { events, dataRef } = store.context;

  const getNodeId = useStableCallback(() => dataRef.current.floatingContext?.nodeId);

  const ignoreInitialFocus = initialFocus === false;
  // A typeable combobox reference (e.g. input/textarea) with `initialFocus={false}`
  // has different focus semantics: focus is not trapped inside the floating element,
  // so in the modal case the guards are not rendered, but `aria-hidden` is still
  // applied to the outside nodes.
  const isUntrappedTypeableCombobox = isTypeableCombobox(domReference) && ignoreInitialFocus;

  const initialFocusRef = useValueAsRef(initialFocus);
  const returnFocusRef = useValueAsRef(returnFocus);
  const openInteractionTypeRef = useValueAsRef(openInteractionType);
  const openRef = useValueAsRef(open);

  const tree = useFloatingTree(externalTree);
  const portalContext = usePortalContext();

  const isPointerDownRef = React.useRef(false);
  const pointerDownOutsideRef = React.useRef(false);
  const lastFocusedTabbableRef = React.useRef<FocusableElement | null>(null);
  const lastInteractionTypeRef = React.useRef<InteractionType>('');

  // One focus session per `active` false-to-true edge. State that only makes sense for a single
  // open interval lives here rather than in component-level refs, so it cannot leak into the next
  // one: a close whose return focus was suppressed must not suppress the next close's.
  const sessionRef = React.useRef<FocusSession | null>(null);
  // True exactly while `sessionRef.current` describes the live session. Maintained by the session
  // effect below, so event handlers can tell a current session from a finished one.
  const sessionActiveRef = React.useRef(false);
  // Return focus queued by the session's teardown, tagged with the session that queued it.
  const pendingReturnRef = React.useRef<PendingReturn | null>(null);

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
  const floatingFocusElement = getFloatingFocusElement(floating);

  const getTabbableContent = useStableCallback(
    (container: Element | null = floatingFocusElement) => {
      return container ? tabbable(container) : [];
    },
  );

  const getResolvedInsideElements = useStableCallback(
    () => getInsideElements?.().filter((element): element is Element => element != null) ?? [],
  );

  // Containment across the whole floating tree, not just this node's own floating element:
  // nested portaled popups and `getInsideElements()` are logically "inside" too.
  const isInsideFloatingTree = useStableCallback((element: Element | null | undefined) => {
    if (!element) {
      return false;
    }
    if (contains(floating, element)) {
      return true;
    }
    if (
      getResolvedInsideElements().some((inside) => inside === element || contains(inside, element))
    ) {
      return true;
    }
    return Boolean(
      tree &&
      getNodeChildren(tree.nodesRef.current, getNodeId(), false).some((node) =>
        contains(node.context?.elements.floating, element),
      ),
    );
  });

  // The focus manager is doing work only while the popup is logically open, enabled, and has a
  // focus element. Everything below keys off this single predicate so the session edge, the
  // cancel-on-resubscribe rule, and the writer currency checks cannot drift apart.
  const active = !disabled && open && floatingFocusElement != null;

  // Opens a session on the `active` false-to-true edge only: dependency churn while open (a
  // replaced floating element, a swapped trigger) must keep the same session, otherwise the
  // element focused before opening would be re-captured as popup content.
  //
  // Declared before the initial-focus and return-focus effects so its setup runs first and they
  // observe the fresh session. Initial focus is deferred to a microtask, so `activeElement` here
  // is still whatever was focused before the popup opened.
  useIsoLayoutEffect(() => {
    if (!active) {
      sessionActiveRef.current = false;
      return;
    }

    const elementFocusedBeforeOpen = activeElement(ownerDocument(floatingFocusElement));

    if (sessionActiveRef.current) {
      const session = sessionRef.current;
      // The session continues across dependency churn, but switching to another trigger moves
      // focus to that trigger *outside* the popup, and that is the element the popup should
      // return focus to. Re-capture only when focus is genuinely outside the floating tree, so a
      // replaced floating element cannot record popup content as the "previously focused"
      // element.
      if (
        session &&
        elementFocusedBeforeOpen &&
        getNodeName(elementFocusedBeforeOpen) !== 'body' &&
        !isInsideFloatingTree(elementFocusedBeforeOpen) &&
        session.elementFocusedBeforeOpen !== elementFocusedBeforeOpen
      ) {
        session.elementFocusedBeforeOpen = elementFocusedBeforeOpen;
        addPreviouslyFocusedElement(elementFocusedBeforeOpen);
      }
      return;
    }

    sessionRef.current = {
      elementFocusedBeforeOpen,
      // Only an explicit `null` interaction type represents a programmatic open.
      // `undefined` is normalized to `''` by the prop default, so it never reaches
      // here as nullish and is intentionally not treated as programmatic.
      preferPreviousFocus: openInteractionTypeRef.current == null,
      preventReturnFocus: false,
      closeType: '',
    };
    sessionActiveRef.current = true;

    addPreviouslyFocusedElement(elementFocusedBeforeOpen);
  }, [
    active,
    domReference,
    floating,
    floatingFocusElement,
    isInsideFloatingTree,
    openInteractionTypeRef,
  ]);

  // Reads the session only while it is the live one. Long-lived native listeners and handlers
  // created during render both outlive a session, so they must resolve it at dispatch time
  // instead of capturing it when they were registered.
  const getCurrentSession = useStableCallback(() =>
    sessionActiveRef.current ? sessionRef.current : null,
  );

  // Prevent Tab from escaping the modal when there are no tabbable elements.
  React.useEffect(() => {
    if (disabled || !modal) {
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
  }, [disabled, floatingFocusElement, modal, isUntrappedTypeableCombobox, getTabbableContent]);

  // Track pointer/keyboard interactions to disambiguate focus and outside presses.
  React.useEffect(() => {
    if (disabled || !open) {
      return undefined;
    }

    const doc = ownerDocument(floatingFocusElement);

    function clearPointerDownOutside() {
      pointerDownOutsideRef.current = false;
    }

    function onPointerDown(event: PointerEvent) {
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

      if (target?.closest(`[${CLICK_TRIGGER_IDENTIFIER}]`)) {
        isPointerDownRef.current = true;
        // Reset on the next tick so a single click on a click-trigger doesn't
        // permanently suppress focus-out closing for the lifetime of the instance.
        pointerDownTimeout.start(0, () => {
          isPointerDownRef.current = false;
        });
      }
    }

    function onKeyDown() {
      lastInteractionTypeRef.current = 'keyboard';
    }

    return mergeCleanups(
      addEventListener(doc, 'pointerdown', onPointerDown, true),
      addEventListener(doc, 'pointerup', clearPointerDownOutside, true),
      addEventListener(doc, 'pointercancel', clearPointerDownOutside, true),
      addEventListener(doc, 'keydown', onKeyDown, true),
      // Avoid a stale `true` leaking into the next open (e.g. keep-mounted popups)
      // if the popup dismissed between pointerdown and pointerup.
      clearPointerDownOutside,
    );
  }, [
    disabled,
    floating,
    domReference,
    floatingFocusElement,
    open,
    portalContext,
    pointerDownTimeout,
    getResolvedInsideElements,
  ]);

  // Close on focus out and restore focus within the floating tree when needed.
  React.useEffect(() => {
    if (disabled || !closeOnFocusOut) {
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
      // This listener outlives individual sessions (its effect does not depend on `open`), so the
      // session is resolved here, at dispatch, and re-checked before the queued work mutates it.
      const session = getCurrentSession();

      // When focus is lost to the body (e.g. on a backdrop press), record the element that
      // had focus so a confirmation dialog opened while the body is focused can return focus
      // to it. Scoped to `modal` to avoid non-modal popups polluting the shared stack.
      if (modal && relatedTarget == null && target != null && contains(floating, target)) {
        addPreviouslyFocusedElement(target);
      }

      queueMicrotask(() => {
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
          // Ignore a focus-out that belongs to a session which has since ended or been replaced:
          // during an exit animation the listener is still attached, and closing again would
          // dispatch a duplicate `onOpenChange`.
          if (session && getCurrentSession() === session) {
            const eventDetails = createChangeEventDetails(REASONS.focusOut, event);
            store.setOpen(false, eventDetails);
            // Only a close that was actually accepted may suppress the return. Setting this
            // before `setOpen` would leak into the next close whenever a consumer cancels
            // this one.
            if (!eventDetails.isCanceled) {
              session.preventReturnFocus = true;
            }
          }
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
    disabled,
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
    getCurrentSession,
    dataRef,
    blurTimeout,
    pointerDownTimeout,
    restoreFocusFrame,
    nextFocusableElement,
    previousFocusableElement,
    getResolvedInsideElements,
  ]);

  // Hide everything outside the floating tree from assistive tech while open.
  React.useEffect(() => {
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

      // enqueueFocus returns a rAF-cancel function; we intentionally don't cancel this focus.
      void enqueueFocus(elToFocus, {
        preventScroll: elToFocus === floatingFocusElement,
        shouldFocus() {
          // This focus is queued on the next animation frame. If the floating element has closed
          // before it runs — e.g. tabbing out of a kept-mounted popup — don't pull focus back
          // onto the initial element after it has legitimately moved elsewhere.
          if (!openRef.current) {
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
  ]);

  // Track return focus targets and restore focus when the session ends.
  //
  // The session ends at the *logical* close (`open` becomes `false`), not when the popup finally
  // unmounts after its exit animation. Focus must not sit inside a subtree that is already closed
  // and about to be made `inert`.
  useIsoLayoutEffect(() => {
    // Cancel a queued return before the early return below. A setup running while the manager is
    // active means the effect is re-subscribing — dependency churn, or a reopen before the queued
    // microtask drained — not closing. This must happen even when no cleanup ran this commit,
    // which is what covers reopening a popup whose session had already ended.
    if (active) {
      pendingReturnRef.current = null;
      // Still open after dependency churn (a trigger switch, a replaced floating element), so a
      // pending "don't return focus" intent belongs to a close that never happened. Leaving it
      // set would silently suppress the next real close.
      const currentSession = sessionRef.current;
      if (currentSession) {
        currentSession.preventReturnFocus = false;
      }
    }

    const maybeSession = sessionRef.current;
    if (!active || !maybeSession) {
      return undefined;
    }

    // Hoisted function declarations below don't see the null-narrowing of `maybeSession`.
    const session: FocusSession = maybeSession;

    const doc = ownerDocument(floatingFocusElement);

    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (!details.open) {
        session.closeType = getEventType(details.nativeEvent, lastInteractionTypeRef.current);
      }

      if (details.reason === REASONS.triggerHover && details.nativeEvent.type === 'mouseleave') {
        session.preventReturnFocus = true;
      }

      if (details.reason !== REASONS.outsidePress) {
        return;
      }

      if (details.nested) {
        session.preventReturnFocus = false;
      } else if (
        isVirtualClick(details.nativeEvent as MouseEvent) ||
        isVirtualPointerEvent(details.nativeEvent as PointerEvent)
      ) {
        session.preventReturnFocus = false;
      } else {
        // On outside press, only return focus to the reference when the browser supports the
        // `focus({ preventScroll })` option; without it, restoring focus scrolls the page.
        // Chrome on Android and Samsung Internet still don't support `preventScroll`
        // (https://issues.chromium.org/issues/41453122), so the runtime check keeps return
        // focus disabled there to avoid the scroll jump.
        let isPreventScrollSupported = false;
        ownerDocument(floatingFocusElement)
          .createElement('div')
          .focus({
            get preventScroll() {
              isPreventScrollSupported = true;
              return false;
            },
          });

        session.preventReturnFocus = !isPreventScrollSupported;
      }
    }

    events.on('openchange', onOpenChangeLocal);

    /**
     * Resolves where focus should go, and whether the caller named that element outright.
     *
     * `isExplicitElement` is deliberately narrower than "the prop is not a boolean":
     * `finalFocus={() => true}`, `finalFocus={() => null}` and a ref that is empty all fall back
     * to the default target, so none of them counts as an explicit instruction.
     */
    function getReturnElement(closeType: InteractionType): {
      element: Element | null;
      isExplicitElement: boolean;
    } {
      const returnFocusValueOrFn = returnFocusRef.current;
      let resolvedReturnFocusValue =
        typeof returnFocusValueOrFn === 'function'
          ? returnFocusValueOrFn(closeType)
          : returnFocusValueOrFn;

      // `null` should fallback to default behavior in case of an empty ref.
      if (resolvedReturnFocusValue === undefined || resolvedReturnFocusValue === false) {
        return { element: null, isExplicitElement: false };
      }

      if (resolvedReturnFocusValue === null) {
        resolvedReturnFocusValue = true;
      }

      const { elementFocusedBeforeOpen } = session;
      const referenceReturnElement = domReference?.isConnected ? domReference : null;
      const previousReturnElement =
        elementFocusedBeforeOpen?.isConnected && getNodeName(elementFocusedBeforeOpen) !== 'body'
          ? elementFocusedBeforeOpen
          : null;

      let defaultReturnElement = session.preferPreviousFocus
        ? previousReturnElement || referenceReturnElement
        : referenceReturnElement || previousReturnElement;

      if (!defaultReturnElement) {
        defaultReturnElement = getPreviouslyFocusedElement() || null;
      }

      if (typeof resolvedReturnFocusValue === 'boolean') {
        return { element: defaultReturnElement, isExplicitElement: false };
      }

      const explicitElement = resolveRef(resolvedReturnFocusValue);
      return {
        element: explicitElement || defaultReturnElement || null,
        isExplicitElement: explicitElement != null,
      };
    }

    return () => {
      events.off('openchange', onOpenChangeLocal);

      const activeEl = activeElement(doc);
      const isFocusInsideFloatingTree = isInsideFloatingTree(activeEl);

      // eslint-disable-next-line react-hooks/exhaustive-deps
      const returnFocusValueOrFn = returnFocusRef.current;
      const closeType = session.closeType;
      const { element: returnElement, isExplicitElement } = getReturnElement(closeType);

      const entry: PendingReturn = {
        session,
        run() {
          // Focus sitting on `body` when the session ended is ambiguous. It happens when a
          // backdrop press drops focus — where returning is wanted — but also when the element
          // that had focus was removed by the very close that is running, e.g. a trigger focus
          // guard closing the popup inside `flushSync` and then moving focus onward itself.
          // Re-check now: if something outside this tree has since taken focus, it owns the
          // destination and returning would both override it and double-focus.
          // An explicitly named target is an instruction from the caller and outranks whatever
          // moved focus during the close, so the handoff check below is skipped for it.
          if (!isExplicitElement && activeEl === doc.body) {
            const currentActiveEl = activeElement(doc);
            if (
              currentActiveEl &&
              currentActiveEl !== doc.body &&
              !isInsideFloatingTree(currentActiveEl)
            ) {
              return;
            }
          }

          // `returnElement` if it is tabbable, otherwise its first tabbable child,
          // otherwise `returnElement` itself (which may not be tabbable at all).
          const tabbableReturnElement = getFirstTabbableElement(returnElement);
          const hasExplicitReturnFocus = typeof returnFocusValueOrFn !== 'boolean';

          if (
            returnFocusValueOrFn &&
            !session.preventReturnFocus &&
            isHTMLElement(tabbableReturnElement) &&
            // If the focus moved somewhere else after mount, avoid returning focus
            // since it likely entered a different element which should be
            // respected: https://github.com/floating-ui/floating-ui/issues/2607
            //
            (!hasExplicitReturnFocus && tabbableReturnElement !== activeEl && activeEl !== doc.body
              ? isFocusInsideFloatingTree
              : true)
          ) {
            const focusOptions: FocusOptions = { preventScroll: true };
            if (closeType === 'keyboard') {
              focusOptions.focusVisible = true;
            }
            tabbableReturnElement.focus(focusOptions);
          }
        },
      };

      pendingReturnRef.current = entry;

      queueMicrotask(() => {
        // Superseded by a newer setup (resubscribe/reopen), or by a newer session having started.
        if (pendingReturnRef.current !== entry || sessionRef.current !== entry.session) {
          return;
        }
        pendingReturnRef.current = null;
        entry.run();
      });
    };
  }, [
    active,
    floating,
    floatingFocusElement,
    returnFocusRef,
    events,
    tree,
    domReference,
    getNodeId,
    isInsideFloatingTree,
  ]);

  // Safari may randomly scroll to the bottom of the page if an input inside a popup has focus
  // when the popup unmounts from the DOM.
  // By blurring it before the popup unmounts, we can prevent this behavior.
  useIsoLayoutEffect(() => {
    if (!platform.engine.webkit || open || !floating) {
      return;
    }

    const activeEl = activeElement(ownerDocument(floating));
    if (!isHTMLElement(activeEl) || !isTypeableElement(activeEl)) {
      return;
    }

    if (contains(floating, activeEl)) {
      activeEl.blur();
    }
  }, [open, floating]);

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

  // Gated on `open`, not merely on `disabled`: while a popup animates out it is still mounted, and
  // an `aria-hidden` guard left in the tab order is exactly the `aria-hidden-focus` violation this
  // is meant to avoid. `FloatingPortal` already gates its outside guards the same way.
  const shouldRenderGuards =
    active && (modal ? !isUntrappedTypeableCombobox : true) && (isInsidePortal || modal);

  return (
    <React.Fragment>
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
              const beforeGuardSession = getCurrentSession();
              if (beforeGuardSession) {
                beforeGuardSession.preventReturnFocus = false;
              }
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
              if (closeOnFocusOut) {
                const afterGuardSession = getCurrentSession();
                if (afterGuardSession) {
                  afterGuardSession.preventReturnFocus = true;
                }
              }

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
    </React.Fragment>
  );
}
