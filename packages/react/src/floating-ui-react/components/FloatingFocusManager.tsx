'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout, Timeout } from '@base-ui/utils/useTimeout';
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
} from '../utils/element';
import { isVirtualClick, stopEvent } from '../utils/event';
import { tabbable, focusable, isTabbable } from '../utils/tabbable';
import type { FocusableElement } from '../utils/tabbable';
import { getNodeAncestors, getNodeChildren } from '../utils/nodes';
import { isElementVisible } from '../utils/composite';
import type { FloatingRootContext } from '../types';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { createAttribute } from '../utils/createAttribute';
import { enqueueFocus } from '../utils/enqueueFocus';
import { markOthers } from '../utils/markOthers';
import {
  addPreviouslyFocusedElement,
  clearDisconnectedPreviouslyFocusedElements,
  getCloseIntent,
  getDefaultReturnTarget,
  getPreviouslyFocusedElement,
  getReturnFocusAction,
  isPreventScrollSupported,
} from '../utils/returnFocus';
import type { ReturnFocusSession } from '../utils/returnFocus';
import { AFTER_CONTENT, BEFORE_CONTENT, focusRoute, getFocusRoute } from '../utils/focusRoute';
import {
  hasCloseRequestSince,
  invalidateCloseRequest,
  markCloseRequest,
  noteFocusMove,
  takeCloseRequest,
} from './FloatingRootStore';
import type { CloseRequestMark } from './FloatingRootStore';
import { usePortalContext } from './FloatingPortal';
import { useFloatingTree } from './FloatingTree';
import type { FloatingTreeStore } from '../components/FloatingTreeStore';
import { CLICK_TRIGGER_IDENTIFIER } from '../../internals/constants';
import { resolveRef } from '../../utils/resolveRef';

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
   * Whether the floating element follows its trigger (the reference) in the tab order, as in
   * Popover and Menu, rather than the place where `FloatingPortal` renders. Tabbing backward out of
   * it then focuses the trigger, which also stays exposed to assistive technology while focus is
   * modal.
   * @default false
   */
  followsTrigger?: boolean | undefined;
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
    followsTrigger = false,
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
  const lastInteractionTypeRef = React.useRef<InteractionType>('');

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

  // Elements outside the floating element that are still part of it, including the guards of its
  // focus route.
  const getResolvedInsideElements = useStableCallback(() =>
    [...(getInsideElements?.() ?? []), ...getFocusRoute(store).map((ref) => ref.current)].filter(
      (element): element is Element => element != null,
    ),
  );

  // Routes focus that reaches the content guards, or the portal's guards around them.
  const handleGuardFocus = useStableCallback((event: React.FocusEvent<HTMLElement>) =>
    focusRoute(store, event, {
      container: portalContext?.portalNode,
      modal,
      followsTrigger,
      closeOnFocusOut,
    }),
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

    function onPointerDown(event: PointerEvent) {
      invalidateCloseRequest(store, event);
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
      invalidateCloseRequest(store, event);
      lastInteractionTypeRef.current = 'keyboard';
    }

    return mergeCleanups(
      addEventListener(doc, 'pointerdown', onPointerDown, true),
      addEventListener(doc, 'pointerup', onPointerUp, true),
      addEventListener(doc, 'pointercancel', onPointerUp, true),
      addEventListener(doc, 'keydown', onKeyDown, true),
      addEventListener(doc, 'focusin', () => noteFocusMove(store), true),
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
    store,
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

        const movedToUnrelatedNode = !(
          contains(domReference, relatedTarget) ||
          contains(floating, relatedTarget) ||
          contains(relatedTarget, floating) ||
          contains(portalContext?.portalNode, relatedTarget) ||
          insideElements.some(
            (element) => element === relatedTarget || contains(element, relatedTarget),
          ) ||
          triggers.hasMatchingElement((trigger) => contains(trigger, relatedTarget)) ||
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

    const insideElements = [
      floating,
      ...portalNodes,
      ...getResolvedInsideElements(),
      rootAncestorComboboxDomReference,
      followsTrigger || isUntrappedTypeableCombobox ? domReference : null,
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
    followsTrigger,
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
      const closeRequestMark = markCloseRequest(store);

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
          if (hasCloseRequestSince(store, closeRequestMark)) {
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
    store,
  ]);

  // A return-focus queued by the effect cleanup. If the effect re-arms in the same commit, a
  // dependency changed while the popup stayed open, so the cleanup was not a close.
  const pendingReturnFocusRef = React.useRef<{
    cancelled: boolean;
    since: CloseRequestMark;
  } | null>(null);

  // Track return focus targets and restore focus when the floating element closes. The policy
  // lives in `returnFocus.ts`; this effect samples its facts, schedules it and moves focus.
  useIsoLayoutEffect(() => {
    if (!open || !floatingFocusElement) {
      pendingReturnFocusRef.current = null;
      return undefined;
    }

    const pending = pendingReturnFocusRef.current;
    if (pending) {
      pending.cancelled = true;
    }
    pendingReturnFocusRef.current = null;
    // A re-arm continues the session. A new one takes only the close requests made from now on:
    // earlier ones belong to an earlier session, whose job may not have run yet (a reopen in the
    // close commit).
    const since = pending ? pending.since : markCloseRequest(store);

    const doc = ownerDocument(floatingFocusElement);
    const session: ReturnFocusSession = {
      reference: domReference,
      before: activeElement(doc),
      // Only an explicit `null` interaction type represents a programmatic open.
      // `undefined` is normalized to `''` by the prop default, so it never reaches
      // here as nullish and is intentionally not treated as programmatic.
      preferBefore: openInteractionTypeRef.current == null,
      // False only while the manager is disabled for this open cycle (Popover hover-open).
      managed: !disabled,
      parent: parentClosedReturnTargetRef,
    };
    pointerPressedRef.current = false;
    addPreviouslyFocusedElement(session.before);
    closedReturnTargetRef.current = null;

    function isOwnFocus(activeEl: Element | null) {
      const insideElements = getResolvedInsideElements();
      return !!(
        contains(floating, activeEl) ||
        insideElements.some((element) => element === activeEl || contains(element, activeEl)) ||
        (tree &&
          getNodeChildren(tree.nodesRef.current, getNodeId(), false).some((node) =>
            contains(node.context?.elements.floating, activeEl),
          ))
      );
    }

    return () => {
      // Before a same-commit deletion removes the DOM (`FloatingPortal` renders its node last).
      const ownedFocusAtClose = isOwnFocus(activeElement(doc));
      // E2 removes its listeners in its passive cleanup, which runs after this layout cleanup.
      const pressed = pointerPressedRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const returnFocusValue = returnFocusRef.current;
      closedReturnTargetRef.current = () => getDefaultReturnTarget(session);

      const job = { cancelled: false, since };
      pendingReturnFocusRef.current = job;

      queueMicrotask(() => {
        if (job.cancelled) {
          return;
        }
        // Taken when the job runs: a consumer's `flushSync` inside `onOpenChange` commits the
        // close before the store records the request.
        const intent = getCloseIntent(
          takeCloseRequest(store, since),
          lastInteractionTypeRef.current,
          pressed,
          () => isPreventScrollSupported(doc),
        );
        const run = () => {
          const activeEl = activeElement(doc);
          const action = getReturnFocusAction(
            session,
            intent,
            returnFocusValue,
            // eslint-disable-next-line react-hooks/exhaustive-deps
            explicitReturnFocusRef.current,
            activeEl,
            isOwnFocus(activeEl),
            ownedFocusAtClose,
            store.select('open'),
          );
          if (action) {
            const [element, focusOptions] = action;
            if (focusOptions) {
              element.focus(focusOptions);
            } else {
              element.blur();
            }
          }
        };

        if (!intent?.settle) {
          run();
          return;
        }

        // Let the press land first: mousedown's default focus, then a `<label>`/onclick focus on
        // click. The next press or key may reopen the popup first; the new session owns focus then.
        // Not `useTimeout`: the deferred return must survive this component unmounting, which a
        // non-animated popup does in the same flush as its close.
        const settle = () => Timeout.create().start(0, run);
        if (intent.settle === 'release') {
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
    parentClosedReturnTargetRef,
  ]);

  // Synchronize the focus manager state (modal, closeOnFocusOut, open, etc.) to the
  // FloatingPortal context, which uses it to decide whether to render its own guards.
  useIsoLayoutEffect(() => {
    if (disabled || !portalContext) {
      return undefined;
    }

    portalContext.setFocusManagerState({
      modal,
      open,
      route: getFocusRoute(store),
      onGuardFocus: handleGuardFocus,
    });

    return () => {
      portalContext.setFocusManagerState(null);
    };
  }, [disabled, portalContext, modal, open, store, handleGuardFocus]);

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

  const route = getFocusRoute(store);

  return (
    <ClosedReturnTargetContext.Provider value={closedReturnTargetRef}>
      {shouldRenderGuards && (
        <FocusGuard data-type="inside" ref={route[BEFORE_CONTENT]} onFocus={handleGuardFocus} />
      )}
      {children}
      {shouldRenderGuards && (
        <FocusGuard data-type="inside" ref={route[AFTER_CONTENT]} onFocus={handleGuardFocus} />
      )}
    </ClosedReturnTargetContext.Provider>
  );
}
