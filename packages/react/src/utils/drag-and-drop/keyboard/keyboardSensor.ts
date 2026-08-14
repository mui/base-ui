/**
 * Keyboard drag sensor.
 *
 * Drives the same lifecycle as the pointer sensor, but synthesizes coordinates
 * from keystrokes instead of reading them from pointer events:
 *
 * - Space / Enter picks the item up when the draggable element itself (or its
 *   configured handle) is focused. A focused control nested inside the item —
 *   e.g. an inline rename input — keeps its own keys instead. The virtual cursor
 *   seeds at the draggable's center.
 * - Arrow keys pick the nearest accepting drop target in the pressed direction
 *   (direction + collision over the drop-target registry), falling back to a
 *   fixed pixel step when none lies ahead. Each move re-resolves the drop target
 *   via `elementFromPoint` and feeds the lifecycle exactly as a pointer move
 *   would, then scrolls it into view.
 * - Space / Enter drops; Escape / Tab / blur cancels.
 *
 * No `dragRootLock` is taken: keyboard navigation needs the page to scroll so
 * the target stays visible.
 */

import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { clamp } from '@base-ui/utils/clamp';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { activeElement, contains, getTarget } from '@base-ui/utils/shadowDom';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import {
  canStart as canStartLifecycle,
  type DragSessionController,
  type DropOutcome,
} from '../core/lifecycleManager';
import { createPreviewAndStartSession, type PreviewSessionHandle } from '../core/sensorSession';
import type { SyntheticPreviewHandle } from '../synthetic/syntheticPreview';
import { clearActivePreviewHandle } from '../activePreview';
import { dragSessionStore } from '../dragSessionStore';
import { getSharedSlot } from '../sharedState';
import { createEventRootBinding, type DragEventRoot } from '../documentBinding';
import { hasInteractiveAncestorWithin, isEditable } from '../interactiveElement';
import {
  findRegisteredAncestor,
  getRegistration,
  resolveDraggablePickup,
} from '../draggableRegistry';
import { getDropTargetShadowRoots } from '../dropTarget';
import type { DraggableConfig } from '../draggable';
import {
  containConsumerError,
  createSyntheticInput,
  elementFromPointIgnoring,
  getComposedParentElement,
  getDragEventRoot,
  getModifierKeys,
  getOverflowFlags,
  getViewportSize,
  isDetachedDocument,
  isPointInRect,
  modifierKeysChanged,
  NO_MODIFIER_KEYS,
  resolveElementReference,
} from '../utils';
import {
  modifyDragPoint,
  createDragModifiersState,
  type DragModifiersState,
} from '../dragModifiers';
import { getAnnouncer, type Announcer } from '../a11y/liveAnnouncer';
import {
  entryPointForTarget,
  findDirectionalTarget,
  getAcceptingTargets,
  invalidateCollisionRects,
  rectCenter,
  unitVector,
  type DirectionalTargetHit,
} from './keyboardCollision';
import type {
  DragCanceledReason,
  DragCleanupFn,
  DragLocationHistory,
  DragSource,
  DragInput,
  DragKeyboardAnnouncements,
  DragKeyboardArrowKey,
  DragKeyboardFinalFocus,
  DragKeyboardFinalFocusParameters,
  DragKeyboardMoveDetails,
  DragKeyboardMoveResult,
  DragKeyboardMoveSuggestion,
  DragKeyboardMovement,
  DragModifierKeys,
  DragPosition,
} from '../../../types/drag';

/** Default per-press step when no target is found in the pressed direction, in CSS pixels. */
const DEFAULT_KEYBOARD_STEP: DragPosition = { x: 24, y: 24 };

/** Shift multiplies the default step for coarse movement. */
const SHIFT_STEP_MULTIPLIER = 4;

/** Debounce for move announcements so held arrow keys don't flood the queue. */
const MOVE_ANNOUNCE_DEBOUNCE_MS = 250;

const ARROW_KEYS = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const SCROLL_KEYS = new Set<string>(['PageUp', 'PageDown', 'Home', 'End']);
const MODIFIER_KEYS = new Set<string>(['Shift', 'Control', 'Alt', 'Meta']);

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

interface ActiveKeyboardSession {
  sourceElement: HTMLElement;
  handle: HTMLElement;
  doc: Document;
  eventRoot: DragEventRoot;
  controller: DragSessionController;
  preview: SyntheticPreviewHandle;
  source: DragSource;
  /**
   * The drop-target element committed by the last move, or `null` before the
   * first move. `dropActive` reuses this instead of re-hit-testing at the cursor
   * (which can resolve a different element after the post-move scroll).
   */
  currentTarget: Element | null;
  /** Virtual cursor (its `clientX`/`clientY`), in client coordinates. */
  lastInput: DragInput;
  /**
   * The `keydown` currently being handled, handed to `controller.update` so the
   * move-derived handlers get a real `eventDetails.event` (so `event.shiftKey`
   * answers for the key that moved the drag) rather than a placeholder. Seeded with
   * the pickup key, so it is a real event from the first move on. `undefined` only
   * between an imperative `startKeyboardDrag()` and the first arrow press, where the
   * details factory substitutes its placeholder.
   */
  lastNativeEvent: KeyboardEvent | undefined;
  /** Compiled `modifiers`, or `null` when the draggable declared none. */
  modifiers: DragModifiersState | null;
  keyboardAnnouncements: DragKeyboardAnnouncements;
  keyboardMovement: DragKeyboardMovement | undefined;
  finalFocus: DragKeyboardFinalFocus | undefined;
  announcer: Announcer;
  /** Coalesces held-arrow repeats to one collision scan per animation frame. */
  repeatMoveFrame: AnimationFrame;
  /** The newest repeat to commit when {@link repeatMoveFrame} fires. */
  pendingRepeatMove: { key: DragKeyboardArrowKey; event: KeyboardEvent } | null;
  listeners: DragCleanupFn[];
}

interface KeyboardDragState {
  active: ActiveKeyboardSession | null;
  /**
   * The pending end-of-drag focus-restore frame, so a new drag or a teardown can
   * cancel it before it fires. Bound to the window of the drag that scheduled it
   * (see {@link AnimationFrame}); each schedule replaces the handle, so a
   * frame pending in a previous drag's window is still cancelable from here.
   */
  pendingFocusFrame: AnimationFrame | null;
  /**
   * Keydown-listener cleanups deferred because they were released while an active
   * keyboard drag still needed them (the dragged source was the last draggable and
   * unmounted mid-drag). Run once the session ends so the ref-counted listener
   * isn't torn down out from under a live drag. A queue rather than a single slot:
   * within one drag the last draggable can unmount, a fresh one mount (re-binding
   * the listener), then unmount again — each defer must be retained, or the first
   * listener leaks.
   */
  deferredUnbinds: Array<() => void>;
}

const state = getSharedSlot<KeyboardDragState>('keyboardDrag', () => ({
  active: null,
  pendingFocusFrame: null,
  deferredUnbinds: [],
}));
/** Prevent one composed key event being handled at both a shadow root and its window. */
const handledEvents = getSharedSlot<WeakSet<Event>>(
  'keyboardDrag.handledEvents',
  () => new WeakSet<Event>(),
);
/**
 * Per-document-or-shadow-root `keydown` listener that starts and drives a
 * keyboard gesture, ref-counted across draggables.
 */
const documentBinding = createEventRootBinding({
  slot: 'keyboardDrag.documentBindings',
  shadowRootsSlot: 'keyboardDrag.boundShadowRoots',
  type: 'keydown',
  listener: onKeyDown,
  // If the dragged source was the last draggable and unmounts mid-drag, the
  // ref-count hits 0 and this cleanup would remove the only keydown path while
  // `state.active` survives — the drag would become uncontrollable. Defer the
  // cleanup and run it from `clearActive()` once the session ends.
  shouldDefer: (root) =>
    state.active?.eventRoot === root ||
    (state.active !== null && getDragEventRoot(state.active.sourceElement) === root),
  onDefer: (cleanup) => {
    state.deferredUnbinds.push(cleanup);
  },
});

export function bindKeyboardListeners(root: DragEventRoot): void {
  documentBinding.bind(root);
}

export function unbindKeyboardListeners(root: DragEventRoot): void {
  documentBinding.unbind(root);
}

function onKeyDown(event: Event): void {
  if (handledEvents.has(event)) {
    return;
  }
  handledEvents.add(event);
  const keyEvent = event as KeyboardEvent;
  if (state.active) {
    // A session whose document lost its browsing context (iframe removed,
    // popout closed) can never end on its own — its terminating listeners
    // lived in the dead realm. This keydown reached another document's
    // binding; cancel the dead session and treat the press as a fresh pickup.
    if (isDetachedDocument(state.active.doc)) {
      cancelActive(false, 'document-detached', keyEvent);
    } else {
      handleActiveKeyDown(keyEvent);
      return;
    }
  }
  handlePickupKeyDown(keyEvent);
}

function handlePickupKeyDown(event: KeyboardEvent): void {
  // `event.repeat`: the drop path ignores OS auto-repeat (see
  // `handleActiveKeyDown`), so the repeats that keep firing after a held-key
  // drop land here with `state.active` null — without this guard they would
  // immediately pick the just-dropped item back up.
  if (event.defaultPrevented || event.repeat || !isActivationKey(event.key)) {
    return;
  }
  // A modifier chord (⌘/Ctrl/Alt + Space/Enter) is an OS/IME/AT shortcut, not a
  // drag pickup; let it through. `Shift` is excluded — it has no pickup shortcut.
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  const pickup = resolveDraggablePickup(getTarget(event));
  if (!pickup) {
    return;
  }
  const { element, target, parameters, dragHandle } = pickup;
  // Keyboard pickup requires focus on the draggable itself, or on its handle
  // exactly: a focused control *inside* either keeps its own Space/Enter instead of
  // starting a drag.
  //
  // `target` came from `getTarget`, which follows `composedPath()[0]` so the
  // registration lookup above can reach a draggable *inside* a web component. That
  // is the wrong node for this exact-match check when the registered element is the
  // shadow host itself, since a host with `delegatesFocus` reports the internal
  // control instead. The untouched `event.target` is retargeted to the host at the
  // boundary, so accepting either keeps both compositions working.
  const retargeted = event.target;
  const pickupNode = dragHandle ?? element;
  if (target !== pickupNode) {
    if (
      retargeted !== pickupNode ||
      (isElement(target) && hasInteractiveAncestorWithin(target, pickupNode))
    ) {
      return;
    }
  }
  // Disabled entirely, or the pickup key belongs to the element (`'manual'`) or to
  // nothing at all (`'off'`): leave the key un-prevented so it propagates to the
  // element's own handler — a menu trigger, say.
  if (parameters.disabled || (parameters.keyboardActivation ?? 'auto') !== 'auto') {
    return;
  }
  const focusTarget = isHTMLElement(target) ? target : element;

  const seed = seedKeyboardPickup(element, parameters, getModifierKeys(event));

  // Refuse before dispatching `onBeforeDragStart` so a pickup that can't
  // proceed (e.g. a drag is already active) never runs the consumer's pre-drag
  // side effects. Swallow the key only when the press lands on the drag's own
  // source (Space must not scroll the page out from under the gesture), and
  // leave any *other* draggable's native key behavior intact: its pickup was
  // never going to start, and eating Enter there would silently deactivate a
  // real button the user meant to press.
  if (!canStartLifecycle()) {
    if (dragSessionStore.getSnapshot()?.source.element === element) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    return;
  }

  // Dispatch `onBeforeDragStart` before swallowing the key. When the consumer
  // cancels, the element is just an ordinary control (a `<button>` may activate
  // on Enter, or Space may scroll), so its native key behavior must be left
  // intact — same as the `keyboardActivation` gate above. Only genuinely-in-progress
  // pickups swallow.
  if (
    !dispatchBeforeDragStart(element, dragHandle, parameters, seed.initialInput, pickupNode, event)
  ) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  beginKeyboardSession({ element, parameters, dragHandle, focusTarget, seed, event });
}

/**
 * Start a keyboard drag on `element` without a key press, as `Space` would. The
 * key-arbitration gates (exact focus, the swallow rule, `preventDefault`) don't apply:
 * the caller named this draggable outright.
 *
 * The details still report `'keyboard'`, but no key was pressed, so
 * `eventDetails.event` is a placeholder `Event` until the first arrow press.
 *
 * Backs `engine.startKeyboardDrag()`.
 */
export function startKeyboardDrag(element: HTMLElement | null): boolean {
  // A deferred pickup (a menu's close callback) can run after the source unmounted:
  // nothing to pick up, but nothing miswired either — unlike a *connected* element
  // that was never a draggable, which `resolveImperativePickup` throws for.
  if (element === null || !element.isConnected) {
    return false;
  }
  const { element: sourceElement, parameters, dragHandle } = resolveImperativePickup(element);

  if (parameters.disabled || parameters.keyboardActivation === 'off') {
    return false;
  }
  if (!canStartLifecycle()) {
    return false;
  }

  // A screen-reader user needs focus on the item they just picked up, not on the menu
  // item that vanished when the menu closed. Before the seed, not after: `.focus()`
  // on an off-screen source scrolls it into view, and the session re-measures the
  // rect — measuring first would leave the preview a scroll delta away from it.
  const focusTarget = (dragHandle as HTMLElement | null) ?? sourceElement;
  const previouslyFocused = activeElement(ownerDocument(sourceElement));
  focusIfPossible(focusTarget);

  const seed = seedKeyboardPickup(sourceElement, parameters);
  const started =
    dispatchBeforeDragStart(
      sourceElement,
      dragHandle,
      parameters,
      seed.initialInput,
      focusTarget,
    ) &&
    beginKeyboardSession({ element: sourceElement, parameters, dragHandle, focusTarget, seed });

  // Nothing was picked up, so focus belongs where the caller had it.
  if (!started && isHTMLElement(previouslyFocused) && previouslyFocused.isConnected) {
    previouslyFocused.focus();
  }
  return started;
}

/**
 * Resolve `element` — the draggable itself, or any descendant — to its registration.
 *
 * Not `resolveDraggablePickup`: its `dragHandle` gate and `disabled` fall-through
 * route a gesture by where it landed. Naming an element is not a gesture, so a
 * `disabled` draggable answers for itself rather than handing the pickup to an
 * ancestor the caller didn't ask for.
 */
function resolveImperativePickup(element: HTMLElement): {
  element: HTMLElement;
  parameters: DraggableConfig<any>;
  dragHandle: Element | null;
} {
  const registered = findRegisteredAncestor(element);
  const getParameters = registered ? getRegistration(registered) : undefined;
  if (registered && getParameters) {
    const parameters = getParameters();
    return {
      element: registered,
      parameters,
      dragHandle: resolveElementReference(parameters.dragHandle, undefined),
    };
  }
  throw new Error(
    'Base UI: startKeyboardDrag() was called with an element that is not a registered ' +
      'draggable, and is not inside one, so there is nothing to pick up. ' +
      'Pass the element you rendered `Draggable.Root` on (or registered with ' +
      '`registerDraggable`), and make sure it is mounted when you call this. ' +
      'See https://base-ui.com/react/utils/use-drag-engine.',
  );
}

/** Everything a pickup measures before the session exists, shared by both entry points. */
interface KeyboardPickupSeed {
  /** Compiled `modifiers`, or `null` when the draggable declared none. */
  modifiers: DragModifiersState | null;
  /** The virtual cursor's starting point, after `modifiers` have had their say. */
  initialInput: DragInput;
}

/**
 * Seed the virtual cursor at the draggable's center. Measured before the session
 * starts, so a `[data-dragging]` rule can't restyle what is measured.
 */
function seedKeyboardPickup(
  element: HTMLElement,
  parameters: DraggableConfig<any>,
  keys: DragModifierKeys = NO_MODIFIER_KEYS,
): KeyboardPickupSeed {
  const pickupRect = element.getBoundingClientRect();
  const { x, y } = rectCenter(pickupRect);

  const modifiers = createDragModifiersState(parameters.modifiers, element, { x, y }, 'keyboard', {
    keys,
    measureSourceRect: () => pickupRect,
  });
  // Start where the modifiers allow, so the seed hit-test, the preview, and
  // the reported input all agree with what the first arrow press will resolve.
  const point = modifiers?.initialPoint ?? { x, y };

  return { modifiers, initialInput: createSyntheticInput(element, point.x, point.y, keys) };
}

/**
 * Dispatch `onBeforeDragStart`, reporting whether the pickup may proceed. A throwing
 * consumer handler must not escape the sensor — uncaught out of the window keydown
 * listener, or out of the consumer's own `startKeyboardDrag()` call — so a throw is
 * contained and treated as a cancel.
 */
function dispatchBeforeDragStart(
  element: HTMLElement,
  dragHandle: Element | null,
  parameters: DraggableConfig<any>,
  initialInput: DragInput,
  trigger: Element,
  event?: KeyboardEvent,
): boolean {
  const { onBeforeDragStart } = parameters;
  if (!onBeforeDragStart) {
    return true;
  }
  const eventDetails = createChangeEventDetails('keyboard', event, trigger);
  const delivered = containConsumerError(
    'Base UI: the "onBeforeDragStart" handler threw, so the keyboard pickup was canceled.',
    element,
    () => {
      onBeforeDragStart({ input: initialInput, element, dragHandle }, eventDetails);
      return true;
    },
    false,
  );
  return delivered && !eventDetails.isCanceled;
}

/**
 * Build the preview, start the lifecycle, and install the active keyboard session —
 * the half of a pickup that is the same whether a key or a consumer asked for it.
 *
 * Returns whether the session started; it does not when the lifecycle refuses or a
 * consumer callback throws while the session is being built.
 */
function beginKeyboardSession(parameters: {
  element: HTMLElement;
  parameters: DraggableConfig<any>;
  dragHandle: Element | null;
  /** The node focus returns to when the drag ends. */
  focusTarget: HTMLElement;
  seed: KeyboardPickupSeed;
  /** The `keydown` that lifted the item, when a key did. */
  event?: KeyboardEvent | undefined;
}): boolean {
  const {
    element,
    parameters: draggableParameters,
    dragHandle,
    focusTarget,
    seed,
    event,
  } = parameters;
  const { modifiers, initialInput } = seed;
  const doc = ownerDocument(element);

  // A focus restore from a just-ended drag may belong to a window that has
  // already closed. Release it before consumer preview/payload code can throw,
  // so a failed pickup cannot leave the stale frame blocking later drags.
  cancelPendingFocusRestore();

  // The shared bootstrap allocates preview + lifecycle and undoes them itself
  // on a throw or a lifecycle refusal, then re-throws. The throw is most likely
  // the consumer's `payload` callback (run while the session is built), so
  // contain it like `onBeforeDragStart` rather than letting it escape the window
  // keydown listener (or the consumer's `startKeyboardDrag()` call); the engine
  // state is already fully undone.
  const result = containConsumerError<PreviewSessionHandle | null>(
    'Base UI: a consumer callback threw while starting a keyboard drag. ' +
      'Treating this pickup as canceled. ' +
      'See the offending element and the original error below.',
    element,
    () =>
      createPreviewAndStartSession({
        mode: 'keyboard',
        draggableParameters,
        element,
        dragHandle,
        initialInput,
        initialEvent: event,
        // Hit-test around the preview: it was just seeded at the virtual cursor.
        getInitialTarget: (preview) =>
          resolveTargetUnderCursor(doc, preview, initialInput.clientX, initialInput.clientY),
        onForceCleanup: clearActive,
      }),
    null,
  );

  if (!result) {
    // The lifecycle refused (a drag is already running), or the bootstrap threw
    // and was contained above.
    return false;
  }

  const { session, preview } = result;

  const win = ownerWindow(element);
  const activeRef: ActiveKeyboardSession = {
    sourceElement: element,
    handle: focusTarget,
    doc,
    eventRoot: getDragEventRoot(element),
    controller: session.controller,
    preview,
    // `start()` publishes the snapshot before returning, so the store holds this
    // drag's source here.
    source: dragSessionStore.getSnapshot()!.source,
    currentTarget: null,
    lastInput: initialInput,
    lastNativeEvent: event,
    modifiers,
    keyboardAnnouncements: draggableParameters.keyboardAnnouncements ?? {},
    keyboardMovement: draggableParameters.keyboardMovement,
    finalFocus: draggableParameters.finalFocus,
    announcer: getAnnouncer(element),
    repeatMoveFrame: new AnimationFrame(win),
    pendingRepeatMove: null,
    listeners: [],
  };
  state.active = activeRef;

  // Cancel if focus leaves the window (the keydown stream would otherwise stop
  // mid-drag with no way to end it), or if focus moves into a text input, where
  // Space/arrows would otherwise be hijacked and preventDefaulted (see
  // `onActiveFocusIn`).
  //
  // `pointerdown` cancels too: the drag is modal over the keyboard, so a user who
  // reaches for the mouse mid-drag would otherwise have the next Space drop the
  // item at a stale virtual cursor instead of activating whatever they clicked.
  // The pointer sensor binds its own `pointerdown` on the *window*, which capture
  // reaches first, so it still refuses to start a pointer drag from this same
  // press — the press cancels, and only a later one lifts with the mouse.
  activeRef.listeners.push(
    // Keep a session-owned continuation path even if the source unregisters
    // synchronously during startup, before `state.active` can make the shared
    // registration listener defer its cleanup. `handledEvents` deduplicates this
    // with any document/shadow-root listener that remains installed.
    addEventListener(win, 'keydown', onKeyDown, { capture: true }),
    addEventListener(win, 'blur', onActiveBlur),
    addEventListener(doc, 'visibilitychange', onActiveVisibilityChange),
    addEventListener(doc, 'focusin', onActiveFocusIn, { capture: true }),
    addEventListener(doc, 'pointerdown', onActivePointerDown, { capture: true }),
    // Releases carry no `keydown`, so a modifier let go between arrow presses
    // would leave `lastInput`'s key flags — and any `canDrop` gated on them — stale.
    addEventListener(win, 'keyup', onActiveKeyUp, { capture: true }),
  );
  // A held arrow can repeat every display frame. Keep target rects across those
  // repeats and invalidate only when layout can actually have changed, instead
  // of forcing a full-document measurement scan on every tick.
  const invalidateRects = () => invalidateCollisionRects();
  const observer = new win.MutationObserver((records) => {
    if (
      records.some((record) => {
        const target = record.target;
        return !(target instanceof win.Element && target.closest('[data-drag-preview]'));
      })
    ) {
      invalidateRects();
    }
  });
  observer.observe(doc, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden'],
  });
  activeRef.listeners.push(
    addEventListener(win, 'resize', invalidateRects),
    addEventListener(doc, 'scroll', invalidateRects, { capture: true }),
    ...Array.from(getDropTargetShadowRoots(), (root) =>
      addEventListener(root, 'scroll', invalidateRects, { capture: true }),
    ),
    () => observer.disconnect(),
  );

  announce(activeRef, 'pickedUp');
  return true;
}

/**
 * Feed the lifecycle a same-position update after the session's modifier keys
 * changed, the keyboard analog of the pointer sensor's `syncActiveModifierKeys`
 * frame: the cursor didn't move, but a `canDrop` gated on a key answers
 * differently now, so the stack must re-resolve on the key change itself rather
 * than sit stale until the next arrow press. `session.lastInput` and
 * `lastNativeEvent` are already stamped with the change by the caller.
 */
function commitModifierSync(session: ActiveKeyboardSession, event: KeyboardEvent): void {
  const { clientX, clientY } = session.lastInput;
  const target = resolveTargetUnderCursor(session.doc, session.preview, clientX, clientY);
  session.currentTarget = target;
  session.controller.update(session.lastInput, target, event);
  session.controller.flushDrag();
}

/**
 * Keep the session's modifier keys current across releases: `keydown` never
 * fires for a release, so without this a `canDrop` gated on Shift would stay
 * engaged after the user lets go.
 */
function onActiveKeyUp(event: Event): void {
  const session = state.active;
  if (!session) {
    return;
  }
  const keyEvent = event as KeyboardEvent;
  if (ARROW_KEYS.has(keyEvent.key) && session.pendingRepeatMove?.key === keyEvent.key) {
    cancelPendingRepeatMove(session);
  }
  const keys = getModifierKeys(keyEvent);
  if (!modifierKeysChanged(session.lastInput, keys)) {
    return;
  }
  session.lastInput = { ...session.lastInput, ...keys };
  // The release is where the new key flags came from, so it is the event the
  // re-resolved dispatches should report.
  session.lastNativeEvent = keyEvent;
  commitModifierSync(session, keyEvent);
}

function handleActiveKeyDown(event: KeyboardEvent): void {
  const session = state.active;
  if (!session) {
    return;
  }
  // Recorded before any branch below can commit a move, so the resulting
  // `onDrag`/`onDropTargetChange` report the key that caused them.
  session.lastNativeEvent = event;
  // Re-stamped for the same reason: the pre-move hit-tests read `session.lastInput`
  // (`findSessionTarget`, `getAcceptingTargets`), so a `canDrop` gated on a modifier
  // key must answer for this press's keys, not the previous press's.
  const modifierKeys = getModifierKeys(event);
  const modifiersChanged = modifierKeysChanged(session.lastInput, modifierKeys);
  session.lastInput = { ...session.lastInput, ...modifierKeys };
  const { key } = event;

  // `onActiveFocusIn` only watches the source's own document, but the sensor
  // binds `keydown` in every document that has a draggable — so focusing a
  // textarea inside a same-origin iframe left the drag swallowing that
  // document's typing. Catch it here, where the key actually arrives: an
  // editable target means focus has moved somewhere that needs these keys more
  // than the drag does.
  const target = getTarget(event);
  if (isElement(target) && isEditable(target)) {
    cancelActive(false, 'focus-out', event);
    return;
  }

  if (key === 'Escape' || key === 'Tab') {
    event.preventDefault();
    event.stopImmediatePropagation();
    cancelActive(true, key === 'Escape' ? 'escape-key' : 'tab-key', event);
    return;
  }

  // A modifier-only press moves nothing, so nothing below feeds the lifecycle;
  // see `commitModifierSync` for why the stack still has to re-resolve here.
  if (MODIFIER_KEYS.has(key)) {
    if (modifiersChanged) {
      commitModifierSync(session, event);
    }
    return;
  }

  // A modifier chord is a shortcut, not a drag command (see `handlePickupKeyDown`);
  // Escape/Tab above already cancelled regardless of modifiers.
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (isActivationKey(key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    // Ignore OS auto-repeat so holding the pickup key doesn't immediately drop.
    if (!event.repeat) {
      dropActive(event);
    }
    return;
  }

  if (ARROW_KEYS.has(key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) {
      scheduleRepeatMove(session, key as DragKeyboardArrowKey, event);
      return;
    }
    cancelPendingRepeatMove(session);
    // One press measures the target registry several times over; let those share
    // one set of rects, and start each press from fresh ones.
    invalidateCollisionRects();
    moveActive(session, key as DragKeyboardArrowKey, event);
    return;
  }

  // Swallow page-scroll keys (PageUp/PageDown/Home/End): the virtual cursor
  // doesn't follow the viewport, so a scroll would desync the next collision.
  if (SCROLL_KEYS.has(key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

function cancelPendingRepeatMove(session: ActiveKeyboardSession): void {
  session.pendingRepeatMove = null;
  session.repeatMoveFrame.cancel();
}

/**
 * OS key repeat can fire faster than the display. Keep only the newest held-key
 * sample and run at most one directional collision scan in each owner-window
 * frame; a genuine first keydown remains immediate in `handleActiveKeyDown`.
 */
function scheduleRepeatMove(
  session: ActiveKeyboardSession,
  key: DragKeyboardArrowKey,
  event: KeyboardEvent,
): void {
  session.pendingRepeatMove = { key, event };
  if (session.repeatMoveFrame.currentId !== null) {
    return;
  }
  session.repeatMoveFrame.request(() => {
    const pending = session.pendingRepeatMove;
    session.pendingRepeatMove = null;
    if (pending === null || state.active !== session) {
      return;
    }
    session.lastNativeEvent = pending.event;
    const keys = getModifierKeys(pending.event);
    session.lastInput = { ...session.lastInput, ...keys };
    // A document MutationObserver cannot see live-reorder mutations inside a
    // shadow tree. Keep the held-key cache for ordinary documents, but measure
    // afresh for the less common shadow-root target case.
    if (!getDropTargetShadowRoots()[Symbol.iterator]().next().done) {
      invalidateCollisionRects();
    }
    moveActive(session, pending.key, pending.event);
  });
}

/**
 * Fallback when no drop target lies ahead: nudge the virtual cursor by a fixed
 * step so free-form dragging still moves. Shift takes a coarser step.
 */
function stepNudge(
  currentInput: DragInput,
  key: DragKeyboardArrowKey,
  shiftKey: boolean,
): DragPosition {
  const factor = shiftKey ? SHIFT_STEP_MULTIPLIER : 1;
  const dir = unitVector(key);
  return {
    x: currentInput.clientX + dir.x * DEFAULT_KEYBOARD_STEP.x * factor,
    y: currentInput.clientY + dir.y * DEFAULT_KEYBOARD_STEP.y * factor,
  };
}

/**
 * Clamp a synthesized cursor position to the viewport so holding Arrow past the
 * last target can't push it permanently off-screen, where `elementFromPoint`
 * returns null and no target is ever reachable again. Prefer the layout viewport
 * (`documentElement.clientWidth/Height`) so the cursor can't land on the
 * scrollbar gutter that `innerWidth/innerHeight` includes, but fall back to the
 * window size when layout reports 0 (a detached document or jsdom).
 */
function clampToViewport(session: ActiveKeyboardSession, position: DragPosition): DragPosition {
  const viewport = getViewportSize(ownerWindow(session.doc.documentElement));
  return {
    x: clamp(position.x, 0, viewport.width - 1),
    y: clamp(position.y, 0, viewport.height - 1),
  };
}

/**
 * Apply the session's `modifiers` to a move point, or pass it through.
 *
 * Clamped again afterwards: a modifier is free to move the point anywhere, and
 * `snapToGrid` in particular rounds *away* from an already-clamped edge. The
 * virtual cursor has to stay inside the viewport or the hit-test resolves
 * nothing for the rest of the drag, so the bound is re-imposed on the result
 * rather than trusted to every built-in and consumer modifier.
 */
function modifyMovePoint(session: ActiveKeyboardSession, point: DragPosition): DragPosition {
  if (!session.modifiers) {
    return point;
  }
  return clampToViewport(
    session,
    modifyDragPoint(session.modifiers, point, 'keyboard', session.preview, sessionKeys(session)),
  );
}

/**
 * The modifier keys of the press being handled. Taken from `lastNativeEvent`, which
 * `handleActiveKeyDown` records before any branch can move, rather than from a field of
 * its own — one source for "which key caused this", shared with `eventDetails.event`.
 * `undefined` only between an imperative `startKeyboardDrag()` and the first press.
 */
function sessionKeys(session: ActiveKeyboardSession): DragModifierKeys {
  return session.lastNativeEvent ? getModifierKeys(session.lastNativeEvent) : NO_MODIFIER_KEYS;
}

/**
 * Whether the session's modifiers leave a directional aim on its target: a
 * modifier that moves the pre-scroll entry point off the target's rect usually
 * means the press could only ever commit somewhere else, so `defaultMove` falls
 * through to a step-nudge without scrolling toward a target that can't be
 * entered. The rects here are read *before* `aimAtElement`'s reveal scroll,
 * though, so a target parked outside a scrollable ancestor's visible box (with,
 * say, `restrictToElement` on that ancestor) fails the in-rect check even when
 * scrolling would carry it under the constrained cursor — that case is allowed
 * via {@link scrollCanSatisfyAim}.
 */
function modifiersAllowAim(session: ActiveKeyboardSession, hit: DirectionalTargetHit): boolean {
  if (!session.modifiers) {
    return true;
  }
  // The pre-reveal aim point the collision already resolved for this winner.
  const aim = hit.point;
  const constrained = modifyMovePoint(session, aim);
  if (constrained.x === aim.x && constrained.y === aim.y) {
    return true;
  }
  if (isPointInRect(constrained.x, constrained.y, hit.element.getBoundingClientRect())) {
    return true;
  }
  return scrollCanSatisfyAim(session, hit.element, aim);
}

/**
 * Whether revealing `target` could still land the constrained cursor on it. The
 * reveal scroll pulls the target to the nearest edge of a scrollable ancestor's
 * visible box, so approximate the post-scroll aim by clamping the aim point
 * into that box and re-ask the modifiers about *that* point. Erring toward
 * `true` only costs the reveal scroll — `defaultMove` re-constrains and probes
 * the post-scroll point, step-nudging when the target still can't be entered.
 */
function scrollCanSatisfyAim(
  session: ActiveKeyboardSession,
  target: Element,
  aim: DragPosition,
): boolean {
  for (
    let ancestor = getComposedParentElement(target);
    ancestor !== null;
    ancestor = getComposedParentElement(ancestor)
  ) {
    // The engine's single overflow answer, shared with the auto-scroller: it reads
    // the `overflow` shorthand as well as the longhands, counts `overlay`, and
    // excludes `display: inline`/`contents`. The hand-rolled longhand-only test
    // this replaced diverged on all three — and since a style setting `overflow`
    // alone is the only form jsdom reports, it made this whole function inert
    // there.
    const overflow = getOverflowFlags(ancestor);
    const scrollableX = overflow.x && ancestor.scrollWidth > ancestor.clientWidth;
    const scrollableY = overflow.y && ancestor.scrollHeight > ancestor.clientHeight;
    if (!scrollableX && !scrollableY) {
      continue;
    }
    const box = ancestor.getBoundingClientRect();
    const postScrollAim = {
      x: clamp(aim.x, box.left, box.right),
      y: clamp(aim.y, box.top, box.bottom),
    };
    const constrained = modifyMovePoint(session, postScrollAim);
    if (isPointInRect(constrained.x, constrained.y, box)) {
      return true;
    }
  }
  return false;
}

function moveActive(
  session: ActiveKeyboardSession,
  key: DragKeyboardArrowKey,
  event: KeyboardEvent,
): void {
  const resolver = session.keyboardMovement;
  if (resolver === undefined) {
    defaultMove(session, key, event.shiftKey);
    return;
  }
  resolverMove(session, key, event, resolver);
}

/**
 * Session-scoped {@link findDirectionalTarget}: every keyboard search shares the
 * same exclusion and modifier plumbing, so call sites pass only what varies.
 * `exclude` is the live dragged node: the engine re-points `source.element`
 * when the source remounts mid-drag, while `session.sourceElement` stays
 * pickup-time.
 */
function findSessionTarget(
  session: ActiveKeyboardSession,
  key: DragKeyboardArrowKey,
  input: DragInput,
): DirectionalTargetHit | null {
  return findDirectionalTarget({
    key,
    source: session.source,
    input,
    exclude: session.source.element,
    modifyPoint: (point) => modifyMovePoint(session, point),
  });
}

/**
 * The built-in behavior for an arrow press: move onto the directional collision
 * winner, or step-nudge the cursor when none lies ahead. `precomputedTarget`
 * reuses a collision result the caller already ran (`resolverMove`'s
 * default-behavior fallback) instead of scanning the registry again.
 */
function defaultMove(
  session: ActiveKeyboardSession,
  key: DragKeyboardArrowKey,
  shiftKey: boolean,
  precomputedTarget?: DirectionalTargetHit | null,
): void {
  const preMoveInput = session.lastInput;
  const hit =
    precomputedTarget !== undefined
      ? precomputedTarget
      : findSessionTarget(session, key, preMoveInput);

  if (hit && modifiersAllowAim(session, hit)) {
    const targetElement = hit.element;
    // Constrained before probing, so the probe, the commit, and the announcement
    // all read the same point. The aim is re-derived after the reveal scroll —
    // `hit.point` was measured against the pre-scroll rect.
    // `findDirectionalTarget` already resolved this element's entry point (that is
    // what it scored), so hand it back rather than re-resolving it.
    const aim = aimAtElement(session, targetElement, key, preMoveInput, hit.point);
    const next = modifyMovePoint(session, aim.point);
    // The entry point can be occluded (a sticky header painted over the target's
    // edge), so the hit-test resolves an unrelated element the target stack never
    // contains. Probe before committing: when the collision-chosen target and the
    // hit-tested element are unrelated, fall through to a plain step-nudge so we
    // don't commit a phantom target. `contains` covers the target itself and its
    // descendants.
    const probe = resolveTargetUnderCursor(session.doc, session.preview, next.x, next.y);
    if (contains(targetElement, probe)) {
      // `aimAtElement` already scrolled the target into view.
      commitMove(session, next, false, aim.scrolled);
      return;
    }
  }
  commitMove(
    session,
    modifyMovePoint(session, clampToViewport(session, stepNudge(preMoveInput, key, shiftKey))),
    true,
  );
}

/** Sentinel separating a resolver throw from every legal `DragKeyboardMoveResult`. */
const RESOLVER_ERROR = Symbol('resolverError');

/**
 * Run a consumer `keyboardMovement` resolver for an arrow press and commit the
 * move it returns. Unlike `defaultMove`, the suggestion is built without side
 * effects (a rejected suggestion must not scroll the page), and there is no
 * occlusion step-nudge fallback — a constrained consumer opted out of nudging,
 * so whatever the hit-test resolves at the committed point (an occluder, or
 * nothing) becomes the target.
 */
function resolverMove(
  session: ActiveKeyboardSession,
  key: DragKeyboardArrowKey,
  event: KeyboardEvent,
  resolver: DragKeyboardMovement,
): void {
  const preMoveInput = session.lastInput;
  const snapshot = dragSessionStore.getSnapshot();
  if (!snapshot) {
    return;
  }

  // Building the suggestion runs the full directional collision — a rect read
  // per registered target — so it is computed lazily: many resolvers derive
  // their own geometry and never read it.
  let suggestedTarget: DirectionalTargetHit | null | undefined;
  let suggestion: DragKeyboardMoveSuggestion | undefined;
  const getSuggestion = (): DragKeyboardMoveSuggestion => {
    if (suggestion === undefined) {
      suggestedTarget = findSessionTarget(session, key, preMoveInput);
      suggestion = suggestedTarget
        ? {
            type: 'target',
            element: suggestedTarget.element,
            position: suggestedTarget.point,
          }
        : {
            type: 'step',
            position: clampToViewport(session, stepNudge(preMoveInput, key, event.shiftKey)),
          };
    }
    return suggestion;
  };

  const details: DragKeyboardMoveDetails = {
    key,
    direction: unitVector(key),
    shiftKey: event.shiftKey,
    event,
    position: { x: preMoveInput.clientX, y: preMoveInput.clientY },
    source: session.source,
    target: snapshot.location.current.dropTargets[0] ?? null,
    location: liveLocation(session, snapshot.location),
    get suggestion() {
      return getSuggestion();
    },
    findTarget: (options) =>
      findSessionTarget(
        session,
        options?.key ?? key,
        // A `from` probe carries the press's own keys, like every other input this
        // session builds: a `canDrop` gated on one has to answer the probe and the
        // move it previews the same way.
        options?.from
          ? createSyntheticInput(
              session.sourceElement,
              options.from.x,
              options.from.y,
              getModifierKeys(event),
            )
          : preMoveInput,
      )?.element ?? null,
    getTargets: () => getAcceptingTargets(session.source, preMoveInput, session.source.element),
  };

  // Contained: a throwing consumer resolver must not escape the window keydown
  // listener, and moving on broken consumer logic is worse than not moving.
  const result = containConsumerError<DragKeyboardMoveResult | typeof RESOLVER_ERROR>(
    'Base UI: the "keyboardMovement" resolver threw. ' +
      'Ignoring this arrow press. ' +
      'See the offending element and the original error below.',
    session.source.element,
    () => resolver(details),
    RESOLVER_ERROR,
  );
  if (result === RESOLVER_ERROR) {
    return;
  }
  // The resolver can call `engine.cancelDrag()` re-entrantly; a commit for
  // the dead session would then move a preview that no longer exists.
  if (state.active !== session) {
    return;
  }

  if (result === undefined || result === null) {
    // Reuse the collision winner when building the suggestion already found it.
    defaultMove(session, key, event.shiftKey, suggestedTarget);
    return;
  }
  if (result === false) {
    announce(session, 'reachedEdge');
    return;
  }
  if (isElement(result)) {
    const aim = aimAtElement(session, result, key, preMoveInput);
    commitMove(session, modifyMovePoint(session, aim.point), false, aim.scrolled);
    return;
  }
  // Narrowed before the `in` probe: a resolver typed loosely (or written in JS)
  // can return any primitive, and `'type' in true` throws out of the window
  // keydown listener — leaving the drag unmovable while still swallowing arrows.
  // Anything unrecognized falls through to the default move.
  if (typeof result !== 'object') {
    defaultMove(session, key, event.shiftKey, suggestedTarget);
    return;
  }
  if ('type' in result) {
    if (result.type === 'target') {
      const aim = aimAtPosition(result.element, result.position);
      const next = modifyMovePoint(session, aim.point);
      // Same occlusion probe the default path runs (see `defaultMove`). A resolver
      // asked for *this target*, so a press that cannot reach it does nothing rather
      // than nudging into the dead space it opted out of.
      const probe = resolveTargetUnderCursor(session.doc, session.preview, next.x, next.y);
      if (!contains(result.element, probe)) {
        announce(session, 'reachedEdge');
        return;
      }
      commitMove(session, next, false, aim.scrolled);
    } else {
      commitMove(
        session,
        modifyMovePoint(session, clampToViewport(session, result.position)),
        true,
      );
    }
    return;
  }
  // A bare position is clamped like every synthesized cursor: off-viewport it
  // would hit-test to nothing forever (see `clampToViewport`). A resolver
  // reaches positions outside the viewport by returning the element instead.
  commitMove(session, modifyMovePoint(session, clampToViewport(session, result)), true);
}

/**
 * Aim the virtual cursor at an element: reveal it first so the aim point reads
 * the post-scroll rect (a row scrolled past a container edge has a rect outside
 * the viewport, where the hit-test would resolve whatever is painted in its
 * place), entering a reorder row at its edge and anything else at its center.
 * The element does not have to be a registered drop target — an unregistered
 * one is aimed at its center.
 */
function aimAtElement(
  session: ActiveKeyboardSession,
  element: Element,
  key: DragKeyboardArrowKey,
  input: DragInput,
  // The aim point the caller already resolved against the *pre-scroll* rect, if it
  // has one. Reused when the reveal didn't scroll, where re-deriving it would run
  // the target's `canDrop` and `payload` a second time for an identical answer;
  // a scroll invalidates it, and it is re-derived below. Omitted by callers whose
  // point came from somewhere other than this element's own entry resolution.
  precomputedPoint?: DragPosition,
): { point: DragPosition; scrolled: boolean } {
  // Don't re-reveal the target the drag is already on. A reorder row entered at
  // its far edge and now being reversed out of resolves to itself, and
  // `block: 'nearest'` on a partially-clipped tall row aligns its *leading* edge
  // — scrolling against the arrow the user just pressed.
  const scrolled = element === session.currentTarget ? false : scrollIntoViewIfPossible(element);
  if (scrolled) {
    // The scroll moved every rect measured so far this press, and the aim point
    // is deliberately re-derived against the post-scroll box.
    invalidateCollisionRects();
  }
  if (!scrolled && precomputedPoint !== undefined) {
    return { point: precomputedPoint, scrolled };
  }
  return { point: entryPointForTarget(element, key, session.source, input), scrolled };
}

/**
 * Reveal `element`, then re-apply `position` — an aim point chosen against the
 * element's current rect — shifted by however far the scroll moved it. Lets a
 * resolver preserve a coordinate on the target ("the adjacent column, at the
 * same time") without losing the scroll that makes the element reachable.
 */
function aimAtPosition(
  element: Element,
  position: DragPosition,
): { point: DragPosition; scrolled: boolean } {
  const preRect = element.getBoundingClientRect();
  const scrolled = scrollIntoViewIfPossible(element);
  if (scrolled) {
    invalidateCollisionRects();
  }
  const postRect = element.getBoundingClientRect();
  return {
    point: {
      x: position.x + (postRect.left - preRect.left),
      y: position.y + (postRect.top - preRect.top),
    },
    scrolled,
  };
}

/**
 * Commit a move to `next`: place the virtual cursor there, hit-test the target
 * under it, feed the lifecycle, and announce. The shared tail of the default
 * and resolver-driven move paths. `next` arrives already constrained — each move
 * path applies `modifiers` before its own probing.
 */
function commitMove(
  session: ActiveKeyboardSession,
  next: DragPosition,
  revealTarget: boolean,
  // Whether revealing the aimed-at element scrolled. A scroll moves the content
  // under the cursor, so identical coordinates still mean the drag went
  // somewhere — without this the reveal's own scroll was announced as an edge.
  scrolled: boolean = false,
): void {
  // A press that moves nothing — fully clamped away by `modifiers`, or a
  // nudge pinned at the viewport edge — is an edge, not a move: announcing
  // "moved" (and firing `onDrag`) for an unchanged position would tell a
  // screen-reader user something happened when nothing did.
  if (!scrolled && next.x === session.lastInput.clientX && next.y === session.lastInput.clientY) {
    announce(session, 'reachedEdge');
    return;
  }
  const keys = sessionKeys(session);
  session.lastInput = createSyntheticInput(session.sourceElement, next.x, next.y, keys);
  session.preview.update(next.x, next.y, keys);
  const target = resolveTargetUnderCursor(session.doc, session.preview, next.x, next.y);
  // Remember exactly what this move resolved and committed so `dropActive` can
  // reuse it instead of re-hit-testing at the cursor, which — after a scroll —
  // can land on a different element than was announced.
  session.currentTarget = target;
  session.controller.update(session.lastInput, target, session.lastNativeEvent);
  // Flush the throttled onDrag so the announcement reads this move's resolved
  // position rather than the previous frame's.
  session.controller.flushDrag();
  // A consumer handler inside `update`/`flushDrag` can call the public
  // `cancelDrag()` re-entrantly, tearing this session down (and announcing the
  // cancel). Scrolling or queueing a debounced "moved" announcement for the
  // dead drag would then read out a stale move after "canceled" — bail out.
  if (state.active !== session) {
    return;
  }
  // An element move already scrolled its element into view (`aimAtElement`);
  // for a position move, keep whatever the cursor landed on in view.
  if (revealTarget) {
    scrollIntoViewIfPossible(target);
  }
  announce(session, 'moved');
}

/** Hit-test at the virtual cursor, ignoring this drag's preview (see {@link elementFromPointIgnoring}). */
function resolveTargetUnderCursor(
  doc: Document,
  preview: SyntheticPreviewHandle,
  x: number,
  y: number,
): Element | null {
  return elementFromPointIgnoring(
    doc,
    x,
    y,
    preview.getPreviewElement()?.element ?? null,
    getDropTargetShadowRoots(),
  );
}

/**
 * Reveal `target`, reporting whether anything actually scrolled.
 *
 * Callers need the answer because a scroll moves the *content* under a cursor
 * whose client coordinates are unchanged — which `commitMove` would otherwise
 * read as "this press moved nothing" and announce as an edge.
 */
function scrollIntoViewIfPossible(target: Element | null): boolean {
  // jsdom doesn't implement scrollIntoView; guard so tests don't throw.
  if (!target || typeof target.scrollIntoView !== 'function') {
    return false;
  }
  const before = target.getBoundingClientRect();
  // `behavior: 'instant'` overrides a `scroll-behavior: smooth` stylesheet;
  // otherwise the scroll animates and the rect read right after is stale.
  target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  const after = target.getBoundingClientRect();
  return after.left !== before.left || after.top !== before.top;
}

// `dropActive`/`cancelActive` capture the store snapshot BEFORE `clearActive()`:
// after teardown `getSnapshot()` returns `null`, so the outcome announcement
// needs this source/session state. The drop lifecycle replaces its location with
// the freshly resolved final one before announcing.
function dropActive(event?: Event): void {
  const session = state.active;
  if (!session) {
    return;
  }
  const input = session.lastInput;
  // Reuse the element the last move committed rather than re-hit-testing at the
  // cursor: a post-move scroll can leave a different element under (x, y) than was
  // resolved and announced. Before the first move there's no committed target, so
  // fall back to a hit-test at the seed cursor. A committed target can also be
  // remounted between the last move and Space, and the detached node walks up to an
  // empty stack, so re-hit-test at the cursor in that case too.
  const target =
    (session.currentTarget?.isConnected ? session.currentTarget : null) ??
    resolveTargetUnderCursor(
      session.doc,
      session.preview,
      session.lastInput.clientX,
      session.lastInput.clientY,
    );
  const snapshot = dragSessionStore.getSnapshot();
  let finalSnapshot = snapshot;
  const controller = session.controller;

  let outcome: DropOutcome = { canceled: true, dropTarget: null };
  // `clearActive()` is not throw-proof (it releases listeners and DOM state that
  // a dead realm can raise on), and a throw that skipped the drop would leave the
  // lifecycle active forever, with `canStart()` false for the rest of the page's
  // life. So the lifecycle is ended either way; the announcement is best-effort.
  // Cancel a debounced move even if final resolution is interrupted before the
  // dropped announcement runs.
  session.announcer.cancelPending();
  session.preview.prepareForDrop();
  try {
    clearActive();
  } finally {
    // The lifecycle rethrows a consumer handler's error, and `clearActive()` has
    // already run — so without the `finally` a throwing `onDrop`/`onDragEnd` would
    // strand the keyboard user on `<body>`. The throw still propagates.
    try {
      outcome = controller.drop(input, target, event, (location) => {
        const resolvedSnapshot = snapshot ? { ...snapshot, location } : null;
        finalSnapshot = resolvedSnapshot;
        announceOutcome(session, resolvedSnapshot, 'dropped');
      });
    } finally {
      // A throwing consumer terminal handler skips `drop`'s return, but the drop
      // itself still committed: read the outcome the lifecycle recorded so a
      // `finalFocus` keyed off the destination doesn't take the cancel branch.
      scheduleRestoreFocus(session, finalSnapshot, controller.committedOutcome ?? outcome);
    }
  }
}

function cancelActive(
  restoreFocus = true,
  reason: DragCanceledReason = 'imperative-action',
  event?: Event,
): void {
  const session = state.active;
  if (!session) {
    return;
  }
  const snapshot = dragSessionStore.getSnapshot();
  const controller = session.controller;

  // See `dropActive`: a throwing `clearActive()` must not cost the lifecycle its
  // terminal cancel, or no drag could ever start again.
  try {
    clearActive();
    // Announce before cancelling, mirroring `dropActive`: after the cancel the
    // store is empty, so a consumer-supplied `canceled` announcement must read
    // the snapshot captured at the moment of cancellation.
    announceOutcome(session, snapshot, 'canceled');
  } finally {
    // See `dropActive`: a rethrown consumer error must not cost the user their
    // focus, since `clearActive()` has already run.
    try {
      controller.cancel(undefined, reason, event);
    } finally {
      // `restoreFocus: false` is the focus-departure path (`onActiveFocusIn`): the
      // cancel exists to hand keys to the editable the user just focused, so
      // yanking focus back a frame later would defeat it.
      if (restoreFocus) {
        scheduleRestoreFocus(session, snapshot, { canceled: true, dropTarget: null });
      }
    }
  }
}

/**
 * Programmatically cancel an in-progress keyboard drag (fires `onDragEnd` with
 * `canceled: true`, announces the cancel, restores focus). No-op when this
 * sensor has no active session. Backs `engine.cancelDrag()`.
 */
export function cancelActiveDrag(): void {
  cancelActive();
}

/**
 * Tear down the keyboard session's own resources (listeners + preview) and
 * clear the singleton, WITHOUT ending the lifecycle. Also passed to the
 * lifecycle as `onForceCleanup` so an abnormal end releases the session.
 */
function clearActive(): void {
  const session = state.active;
  if (!session) {
    return;
  }
  state.active = null;
  cancelPendingRepeatMove(session);
  clearActivePreviewHandle(session.preview);
  // The per-press rect cache would otherwise hold every candidate this drag
  // measured until some later drag's first arrow press cleared it.
  invalidateCollisionRects();
  // Cancel a debounced move announcement so no stale "moved to…" lands after teardown.
  session.announcer.cancelPending();
  // Drop any pending focus restore: the force-cleanup path has no `scheduleRestoreFocus`.
  cancelPendingFocusRestore();
  for (const off of session.listeners) {
    off();
  }
  try {
    session.preview.destroy();
  } finally {
    // Drain any keydown-listener cleanups deferred while this drag was live (see
    // `unbindKeyboardListeners`). The session has ended, so it is safe now.
    if (state.deferredUnbinds.length > 0) {
      const runDeferred = state.deferredUnbinds;
      state.deferredUnbinds = [];
      for (const cleanup of runDeferred) {
        cleanup();
      }
    }
  }
}

function onActiveBlur(event: Event): void {
  cancelActive(true, 'window-blur', event);
}

/**
 * Cancel the drag when focus moves into an editable control. Otherwise Space
 * (drop), arrows (move), and page keys stay preventDefaulted while the user is
 * trying to type, hijacking the keyboard. Focus moving to a non-editable element
 * is left alone: the drag stays modal (keys keep driving it) until an explicit
 * drop/cancel, matching the sensor's window-level key capture.
 */
function onActiveFocusIn(event: Event): void {
  const session = state.active;
  if (!session) {
    return;
  }
  const target = getTarget(event);
  if (!isElement(target)) {
    return;
  }
  if (isEditable(target)) {
    cancelActive(false, 'focus-out', event);
  }
}

function onActiveVisibilityChange(event: Event): void {
  const session = state.active;
  if (session && ownerDocument(session.sourceElement).visibilityState === 'hidden') {
    cancelActive(true, 'page-hidden', event);
  }
}

// Don't restore focus: the press is already moving focus somewhere deliberate,
// and pulling it back to the source would fight the click.
function onActivePointerDown(event: Event): void {
  if (state.active) {
    cancelActive(false, 'pointer-down', event);
  }
}

// ---------------------------------------------------------------------------
// Announcements + focus restoration
// ---------------------------------------------------------------------------

/** Stand-in for an announcement that isn't set; the same answer as one returning `null`. */
const stayQuiet = () => null;

/**
 * The announcement callback for `name`.
 *
 * No English fallback: every registration path runs through the engine, which
 * merges the consumer's overrides over a fully-built, locale-aware set, so a
 * missing key is unreachable rather than a case to cover.
 */
function getAnnouncement<K extends keyof DragKeyboardAnnouncements>(
  session: ActiveKeyboardSession,
  name: K,
): NonNullable<Required<DragKeyboardAnnouncements>[K]> {
  return (session.keyboardAnnouncements[name] ?? stayQuiet) as NonNullable<
    Required<DragKeyboardAnnouncements>[K]
  >;
}

/**
 * Resolve the announcement callback for `name`, run it against `snapshot`, and
 * write any truthy message to the announcer. Shared by the live and terminal
 * announcers; `cancelPending` drops a queued (debounced) move announcement
 * before announcing, and `announceOptions` carries the move debounce.
 */
function runAnnouncement(
  session: ActiveKeyboardSession,
  snapshot: ReturnType<typeof dragSessionStore.getSnapshot>,
  name: keyof DragKeyboardAnnouncements,
  options?: {
    cancelPending?: boolean | undefined;
    announceOptions?: { debounceMs: number } | undefined;
  },
): void {
  if (options?.cancelPending) {
    session.announcer.cancelPending();
  }
  if (!snapshot) {
    return;
  }
  // Contained: terminal announcements run while the lifecycle is still active,
  // after sensor teardown. A throwing callback must not leave the global
  // lifecycle with no sensor owning it and refuse every later pickup.
  const message = containConsumerError(
    `Base UI: the "${name}" keyboard announcement callback threw and was skipped.`,
    session.source.element,
    () =>
      getAnnouncement(
        session,
        name,
      )({
        source: snapshot.source,
        location: liveLocation(session, snapshot.location),
      }),
    '',
  );
  if (message) {
    session.announcer.announce(message, options?.announceOptions);
  }
}

/**
 * The location history with the sensor's live cursor spliced into
 * `current.input`: the store republishes only on stack changes, so the
 * snapshot's input goes stale on same-stack moves.
 */
function liveLocation(
  session: ActiveKeyboardSession,
  location: DragLocationHistory,
): DragLocationHistory {
  const input = session.lastInput;
  return location.current.input === input
    ? location
    : { ...location, current: { ...location.current, input } };
}

/** Announce a live (mid-drag) phase, reading the current session snapshot. */
function announce(
  session: ActiveKeyboardSession,
  name: 'pickedUp' | 'moved' | 'reachedEdge',
): void {
  runAnnouncement(session, dragSessionStore.getSnapshot(), name, {
    // Debounce the repeatable phases so held arrow keys don't flood the queue.
    announceOptions: name === 'pickedUp' ? undefined : { debounceMs: MOVE_ANNOUNCE_DEBOUNCE_MS },
  });
}

/** Announce a terminal phase using a snapshot captured before teardown. */
function announceOutcome(
  session: ActiveKeyboardSession,
  snapshot: ReturnType<typeof dragSessionStore.getSnapshot>,
  name: 'dropped' | 'canceled',
): void {
  // The drag is ending: drop any move announcement still waiting out its
  // debounce so a stale "moved to…" doesn't land after teardown. A truthy
  // terminal message below clears it too, but a falsy one would not.
  runAnnouncement(session, snapshot, name, { cancelPending: true });
}

/**
 * Resolve the `finalFocus` option to a concrete intent: focus a specific
 * element, fall back to the default behavior, or do nothing.
 */
function resolveFinalFocus(
  value: DragKeyboardFinalFocus | undefined,
  parameters: DragKeyboardFinalFocusParameters,
): HTMLElement | 'default' | 'none' {
  if (value === undefined || value === true) {
    return 'default';
  }
  if (value === false) {
    return 'none';
  }
  if (typeof value === 'function') {
    const result = value(parameters);
    // `true` and `null` defer to the default behavior; `false`/`undefined` do
    // nothing; anything else is the element to focus. Mirrors Base UI's
    // `finalFocus` callback contract.
    if (result === true || result === null) {
      return 'default';
    }
    if (result === false || result === undefined) {
      return 'none';
    }
    return isHTMLElement(result) ? result : 'none';
  }
  // RefObject: focus the ref element, or defer to the default when it is empty.
  return isHTMLElement(value.current) ? value.current : 'default';
}

/** Apply the default focus behavior: handle, then source, then drop target. */
function applyDefaultFinalFocus(
  session: ActiveKeyboardSession,
  location: DragLocationHistory | null,
): void {
  // The live dragged node (see `moveActive`): after a mid-drag remount the
  // pickup-time refs are detached and focus would fall through to the drop
  // target, which is often non-focusable.
  const sourceElement = session.source.element;
  // The draggable's *current* handle first: a keyed handle button remounted
  // during the reorder is a different node than the one pressed at pickup, and
  // the surviving root is usually not focusable — trying only the pickup-time
  // pair would drop focus on `<body>`.
  const registration = getRegistration(sourceElement);
  const currentHandle = registration
    ? (resolveElementReference(registration().dragHandle, undefined) as HTMLElement | null)
    : null;
  for (const candidate of [currentHandle, session.handle, sourceElement]) {
    if (candidate?.isConnected && focusIfPossible(candidate)) {
      return;
    }
  }
  const fallback = location?.current.dropTargets[0]?.element;
  if (isHTMLElement(fallback)) {
    focusIfPossible(fallback);
  }
}

/**
 * Focus `element`, reporting whether it took. A connected node is not
 * necessarily focusable: the engine reads `disabled` only at pickup, so a
 * draggable that flips it mid-drag (`onDragStart={() => setBusy(true)}`, which
 * the docs advertise) re-renders as a natively disabled button, or as a root
 * that lost its `tabIndex` — and `.focus()` on either silently no-ops. Returning
 * `false` there lets the cascade keep looking instead of dropping the keyboard
 * user on `<body>`.
 */
function focusIfPossible(element: HTMLElement): boolean {
  element.focus();
  // Shadow-safe: `Document.activeElement` reports the *host* for anything inside
  // a shadow tree, so a draggable in a web component would read as never
  // focusable and the cascade would walk past it onto `<body>`.
  return activeElement(ownerDocument(element)) === element;
}

/** Cancel a pending end-of-drag focus restore, if any. */
function cancelPendingFocusRestore(): void {
  state.pendingFocusFrame?.cancel();
  state.pendingFocusFrame = null;
}

function scheduleRestoreFocus(
  session: ActiveKeyboardSession,
  snapshot: ReturnType<typeof dragSessionStore.getSnapshot>,
  outcome: Pick<DragKeyboardFinalFocusParameters, 'canceled' | 'dropTarget'>,
): void {
  const location: DragLocationHistory | null = snapshot?.location ?? null;
  // Restore after the commit so a reordering collection has remounted the item.
  cancelPendingFocusRestore();
  const frame = new AnimationFrame(ownerWindow(session.source.element));
  state.pendingFocusFrame = frame;
  frame.request(() => {
    // Contained: the live registration/`dragHandle` getters the default cascade
    // reads are consumer code. A throw inside a rAF is unhandled and would abort
    // the restore silently, leaving focus on `<body>` — the exact failure the
    // cascade exists to prevent. (`finalFocus` itself is contained one level in,
    // where a throw can still fall back to the cascade.)
    containConsumerError(
      'Base UI: reading a drag handle threw while restoring focus after a drag, ' +
        'so focus was left where the drag ended.',
      session.source.element,
      () => restoreFocusNow(session, location, outcome),
      undefined,
    );
  });
}

function restoreFocusNow(
  session: ActiveKeyboardSession,
  location: DragLocationHistory | null,
  outcome: Pick<DragKeyboardFinalFocusParameters, 'canceled' | 'dropTarget'>,
): void {
  // `snapshot` is captured while the drag is still active at both call sites,
  // so `location` is present in practice. Guard the theoretical null defensively
  // by deferring to the default cascade, keeping `finalFocus`'s `location`
  // non-nullable for consumers.
  if (location === null) {
    applyDefaultFinalFocus(session, null);
    return;
  }
  // A throwing `finalFocus` falls back to the default cascade rather than to no
  // focus at all: the consumer opted into *choosing* the landing spot, not into
  // stranding focus on `<body>`.
  const target = containConsumerError<HTMLElement | 'default' | 'none'>(
    'Base UI: a `finalFocus` callback threw, so the default focus behavior was used. ' +
      'Fix the callback error shown below.',
    session.source.element,
    () =>
      resolveFinalFocus(session.finalFocus, {
        source: session.source,
        location,
        canceled: outcome.canceled,
        dropTarget: outcome.dropTarget,
      }),
    'default',
  );
  if (target === 'none') {
    return;
  }
  if (target === 'default') {
    applyDefaultFinalFocus(session, location);
    return;
  }
  // The resolved element may have been removed by the reorder commit that ran
  // before this rAF; fall back to the default cascade so focus is never lost.
  if (target.isConnected) {
    target.focus();
  } else {
    applyDefaultFinalFocus(session, location);
  }
}

export function resetForTests(): void {
  clearActive();
  // A drop schedules the focus-restore frame *after* the session is cleared, so
  // `clearActive` alone can't reach it post-drop — a `focus()` landing after
  // reset would steal focus from whatever was focused in the meantime.
  cancelPendingFocusRestore();
  for (const unbind of state.deferredUnbinds.splice(0)) {
    unbind();
  }
}
