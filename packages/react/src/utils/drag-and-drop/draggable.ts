import type {
  DragCleanupFn,
  DragHandle,
  DragKind,
  DragStartContext,
  DraggablePayload,
  DraggablePayloadGetter,
  DragPreviewParameters,
  DragPreviewContainer,
  BeforeDragStartEventDetails,
  DragEventDetailsMap,
  DragEventMap,
  DragPreviewRenderEvent,
  DragKeyboardActivation,
  DragKeyboardAnnouncements,
  DragKeyboardFinalFocus,
  DragKeyboardMovement,
  DragModifiers,
} from '../../types/drag';
import type { DragPreviewDeclaration } from './dragPreviewDeclaration';
import type { DragActivationConfig } from './activation';
import { bindPointerListeners, unbindPointerListeners } from './synthetic/syntheticSensor';
import { bindKeyboardListeners, unbindKeyboardListeners } from './keyboard/keyboardSensor';
import { ensureKeyboardInstructions } from './a11y/keyboardInstructions';
import { getAnnouncer } from './a11y/liveAnnouncer';
import { getRegistration } from './draggableRegistry';
import { getSharedSlot } from './sharedState';
import { registerStaticSetupRefresh } from './staticSetupRefresh';
import { getDragEventRoot, onceCleanup, resolveElementReference } from './utils';

/** Append `id` to a space-separated token attribute, returning the new value. */
function addToken(existing: string | null, id: string): string {
  if (!existing) {
    return id;
  }
  return existing.split(/\s+/).includes(id) ? existing : `${existing} ${id}`;
}

/** Remove `id` from a space-separated token attribute, returning the new value. */
function removeToken(existing: string | null, id: string): string {
  if (!existing) {
    return '';
  }
  return existing
    .split(/\s+/)
    .filter((token) => token && token !== id)
    .join(' ');
}

interface KeyboardSetupHold {
  /**
   * The `aria-describedby` instruction id this registrant contributed, or `null`
   * when it has none to describe (`keyboardActivation: 'manual'` with no consumer text).
   * Such a hold still carries a role description.
   */
  instructionId: string | null;
  /** The `aria-roledescription` this registrant wants. */
  roleDescription: string;
}

interface KeyboardSetupEntry {
  /**
   * One entry per keyboard-enabled registrant, removed by identity so a registrant's
   * instruction id and role description are always dropped as the pair it
   * contributed. The element carries the ARIA attributes while this is non-empty,
   * with the most recent surviving registrant's role description winning.
   */
  holds: KeyboardSetupHold[];
  /** Apply the union of the current registrants' ARIA state to the element. */
  reconcile: () => void;
  /** Restore the captured keyboard accessibility attributes. */
  restore: () => void;
}

interface GestureSetupEntry {
  count: number;
  restore: () => void;
}

const keyboardSetups = getSharedSlot<WeakMap<Element, KeyboardSetupEntry>>(
  'draggable.keyboardSetups',
  () => new WeakMap<Element, KeyboardSetupEntry>(),
);

const gestureSetups = getSharedSlot<WeakMap<Element, GestureSetupEntry>>(
  'draggable.gestureSetups',
  () => new WeakMap<Element, GestureSetupEntry>(),
);

/**
 * Flatten the resolved inputs feeding {@link applyDraggableStaticSetup} into a
 * comparable key, so callers refresh the setup only when it would actually change.
 * Takes the a11y strings post-localization, so an explicit override shadowing a
 * changing locale default doesn't churn the key. The unit separator keeps the
 * free-form strings from aliasing across fields.
 */
export function buildStaticSetupKey(inputs: {
  disabled?: boolean | undefined;
  keyboardActivation?: DragKeyboardActivation | undefined;
  ariaRoleDescription: string;
  keyboardInstructions: string;
}): string {
  return [
    inputs.keyboardActivation ?? 'auto',
    Boolean(inputs.disabled),
    inputs.ariaRoleDescription,
    inputs.keyboardInstructions,
  ].join('\u001f');
}

interface DraggableStaticSetupParameters {
  element: HTMLElement;
  dragHandle?: DragHandle | undefined;
  pointerDragHandle?: DragHandle | undefined;
  keyboardDragHandle?: DragHandle | undefined;
  // Required, already localization-resolved: the engine is the single home for
  // `?? translations.…` defaulting, so a second layer here can't drift out of sync.
  // Empty means "say nothing", which is what `keyboardActivation: 'manual'` resolves to.
  ariaRoleDescription: string;
  keyboardInstructions: string;
  keyboardActivation?: DragKeyboardActivation | undefined;
  disabled?: boolean | undefined;
}

/**
 * Apply the pointer gesture styles to one element. Pointer and keyboard ownership
 * are kept separate because a keyboard-only handle leaves pointer pickup on the root.
 *
 * The setup is ref-counted because multiple registrations can share a node.
 */
function applyGestureSetup(
  gestureElement: HTMLElement,
  disabled: boolean | undefined,
): DragCleanupFn {
  if (disabled) {
    return () => {};
  }

  let entry = gestureSetups.get(gestureElement);
  if (!entry) {
    const gestureStyle = gestureElement.style as CSSStyleDeclaration & Record<string, string>;
    const previous = {
      touchAction: gestureStyle.touchAction ?? '',
      userSelect: gestureStyle.userSelect ?? '',
      webkitUserSelect: gestureStyle.webkitUserSelect ?? '',
      webkitTouchCallout: gestureStyle.webkitTouchCallout ?? '',
    };
    gestureStyle.touchAction = 'manipulation';
    gestureStyle.userSelect = 'none';
    gestureStyle.webkitUserSelect = 'none';
    gestureStyle.webkitTouchCallout = 'none';
    entry = {
      count: 0,
      restore() {
        if (gestureStyle.touchAction === 'manipulation') {
          gestureStyle.touchAction = previous.touchAction;
        }
        if (gestureStyle.userSelect === 'none') {
          gestureStyle.userSelect = previous.userSelect;
        }
        if (gestureStyle.webkitUserSelect === 'none') {
          gestureStyle.webkitUserSelect = previous.webkitUserSelect;
        }
        if (gestureStyle.webkitTouchCallout === 'none') {
          gestureStyle.webkitTouchCallout = previous.webkitTouchCallout;
        }
      },
    };
    gestureSetups.set(gestureElement, entry);
  }
  entry.count += 1;
  const activeEntry = entry;
  return onceCleanup(() => {
    const current = gestureSetups.get(gestureElement);
    if (current !== activeEntry) {
      return;
    }
    current.count -= 1;
    if (current.count === 0) {
      gestureSetups.delete(gestureElement);
      current.restore();
    }
  });
}

/** Apply keyboard instructions and role description to the keyboard pickup element. */
function applyKeyboardSetup(
  keyboardElement: HTMLElement,
  parameters: DraggableStaticSetupParameters,
): { release: DragCleanupFn; reconcile: () => void } {
  const keyboardEnabled = (parameters.keyboardActivation ?? 'auto') !== 'off';
  if (parameters.disabled || !keyboardEnabled) {
    return { release: () => {}, reconcile: () => {} };
  }

  // The instructions node is created relative to `keyboardElement`, which is the node
  // that receives the `aria-describedby`: an ARIA IDREF cannot cross a shadow
  // boundary, so a handle inside a shadow root needs the node in *its* root. Empty
  // text buys no node. `'manual'` says nothing unless the consumer wrote it.
  const instructionsHold =
    parameters.keyboardInstructions !== ''
      ? ensureKeyboardInstructions(keyboardElement, parameters.keyboardInstructions)
      : null;
  // Pre-create the live region while the draggable registers. Screen readers can
  // drop an announcement written into a region inserted in the same tick.
  getAnnouncer(parameters.element);

  const hold: KeyboardSetupHold = {
    instructionId: instructionsHold?.id ?? null,
    roleDescription: parameters.ariaRoleDescription,
  };

  let entry = keyboardSetups.get(keyboardElement);
  if (!entry) {
    const hadRoleDescription = keyboardElement.hasAttribute('aria-roledescription');
    const previousRoleDescription = keyboardElement.getAttribute('aria-roledescription');

    const created: KeyboardSetupEntry = {
      holds: [],
      reconcile() {
        const existing = keyboardElement.getAttribute('aria-describedby');
        if (created.holds.length > 0) {
          if (!hadRoleDescription || previousRoleDescription == null) {
            keyboardElement.setAttribute(
              'aria-roledescription',
              created.holds[created.holds.length - 1].roleDescription,
            );
          }
          let nextDescribedBy = existing;
          for (const heldSetup of created.holds) {
            if (heldSetup.instructionId !== null) {
              nextDescribedBy = addToken(nextDescribedBy, heldSetup.instructionId);
            }
          }
          if (nextDescribedBy && nextDescribedBy !== existing) {
            keyboardElement.setAttribute('aria-describedby', nextDescribedBy);
          }
        }
      },
      restore() {
        if (!hadRoleDescription) {
          keyboardElement.removeAttribute('aria-roledescription');
        } else if (previousRoleDescription != null) {
          keyboardElement.setAttribute('aria-roledescription', previousRoleDescription);
        }
      },
    };
    entry = created;
    keyboardSetups.set(keyboardElement, entry);
  }

  const activeEntry = entry;
  activeEntry.holds.push(hold);
  activeEntry.reconcile();

  const release = onceCleanup(() => {
    instructionsHold?.release();
    const current = keyboardSetups.get(keyboardElement);
    if (current !== activeEntry) {
      return;
    }
    const index = current.holds.indexOf(hold);
    if (index !== -1) {
      current.holds.splice(index, 1);
    }
    if (
      hold.instructionId !== null &&
      !current.holds.some((heldSetup) => heldSetup.instructionId === hold.instructionId)
    ) {
      const restoredDescribedBy = removeToken(
        keyboardElement.getAttribute('aria-describedby'),
        hold.instructionId,
      );
      if (restoredDescribedBy) {
        keyboardElement.setAttribute('aria-describedby', restoredDescribedBy);
      } else {
        keyboardElement.removeAttribute('aria-describedby');
      }
    }
    if (current.holds.length === 0) {
      keyboardSetups.delete(keyboardElement);
      current.restore();
    } else {
      current.reconcile();
    }
  });

  return {
    release,
    // A registrant with no keyboard hold owns no attributes, so it has nothing to
    // re-assert.
    reconcile: () => {
      if (keyboardSetups.get(keyboardElement) === activeEntry) {
        activeEntry.reconcile();
      }
    },
  };
}

/** Apply both static setup paths to their input-specific elements. */
function applyStaticSetup(parameters: DraggableStaticSetupParameters): {
  release: DragCleanupFn;
  reconcile: () => void;
} {
  const pointerHandle = resolveElementReference(
    parameters.pointerDragHandle ?? parameters.dragHandle,
    undefined,
  );
  const keyboardHandle = resolveElementReference(
    parameters.keyboardDragHandle ?? parameters.dragHandle,
    undefined,
  );
  const pointerElement = (pointerHandle as HTMLElement | null) ?? parameters.element;
  const keyboardElement = (keyboardHandle as HTMLElement | null) ?? parameters.element;
  const releaseGesture = applyGestureSetup(pointerElement, parameters.disabled);
  const keyboardSetup = applyKeyboardSetup(keyboardElement, parameters);
  return {
    release: onceCleanup(() => {
      releaseGesture();
      keyboardSetup.release();
    }),
    reconcile: keyboardSetup.reconcile,
  };
}

/**
 * Static DOM setup for a draggable (see {@link applyStaticSetup}), applied from the
 * parameters read at registration and refreshed from the element's live registration
 * when the user next interacts with it. Registration behavior is re-read on every
 * event, so without the refresh an imperative consumer whose `disabled`, a11y
 * strings, or resolved `dragHandle` element changed would keep stale DOM
 * attributes (on a stale node) until re-registration. Returns a cleanup that
 * releases the current hold.
 */
export function applyDraggableStaticSetup(
  parameters: DraggableStaticSetupParameters,
): DragCleanupFn {
  const { element } = parameters;
  let appliedKey = buildStaticSetupKey(parameters);
  let appliedPointerElement =
    (resolveElementReference(
      parameters.pointerDragHandle ?? parameters.dragHandle,
      undefined,
    ) as HTMLElement | null) ?? element;
  let appliedKeyboardElement =
    (resolveElementReference(
      parameters.keyboardDragHandle ?? parameters.dragHandle,
      undefined,
    ) as HTMLElement | null) ?? element;
  let setup = applyStaticSetup(parameters);

  const refreshFromRegistration = () => {
    const getParameters = getRegistration(element);
    if (getParameters === undefined) {
      return;
    }
    const latest = getParameters();
    // A registration that skipped the engine's normalization carries no
    // resolved a11y strings to compare against.
    if (latest.ariaRoleDescription === undefined || latest.keyboardInstructions === undefined) {
      return;
    }
    const nextKey = buildStaticSetupKey({
      disabled: latest.disabled,
      keyboardActivation: latest.keyboardActivation,
      ariaRoleDescription: latest.ariaRoleDescription,
      keyboardInstructions: latest.keyboardInstructions,
    });
    // The key covers the setup's inputs; the resolved handle covers *where* it
    // was applied — a swapped `dragHandle` must move the gesture styles and
    // ARIA off the old node even when no keyed input changed.
    const nextPointerElement =
      (resolveElementReference(
        latest.pointerDragHandle ?? latest.dragHandle,
        undefined,
      ) as HTMLElement | null) ?? element;
    const nextKeyboardElement =
      (resolveElementReference(
        latest.keyboardDragHandle ?? latest.dragHandle,
        undefined,
      ) as HTMLElement | null) ?? element;
    if (
      nextKey === appliedKey &&
      nextPointerElement === appliedPointerElement &&
      nextKeyboardElement === appliedKeyboardElement
    ) {
      // Nothing about the setup's inputs changed, but the attributes it wrote are
      // shared DOM: a consumer-controlled `aria-describedby` rewritten by React
      // drops the keyboard-instructions idref, and a screen-reader user silently
      // loses the gesture hint for the rest of the page's life. The re-apply is
      // idempotent, so this costs an attribute read on an unchanged refresh.
      setup.reconcile();
      return;
    }
    appliedKey = nextKey;
    appliedPointerElement = nextPointerElement;
    appliedKeyboardElement = nextKeyboardElement;
    setup.release();
    setup = applyStaticSetup({
      element,
      dragHandle: latest.dragHandle,
      pointerDragHandle: latest.pointerDragHandle,
      keyboardDragHandle: latest.keyboardDragHandle,
      ariaRoleDescription: latest.ariaRoleDescription,
      keyboardInstructions: latest.keyboardInstructions,
      keyboardActivation: latest.keyboardActivation,
      disabled: latest.disabled,
    });
  };

  // The two modalities' entry points: a pointer gesture starts with a `pointerdown`
  // inside the element, and a keyboard pickup requires focusing it first. Both are
  // watched once per document or shadow root rather than once per draggable — see
  // `./staticSetupRefresh`.
  const releaseRefresh = registerStaticSetupRefresh(element, refreshFromRegistration);

  return onceCleanup(() => {
    releaseRefresh();
    setup.release();
  });
}

/**
 * Bind the pointer and keyboard sensors at `element`'s document or shadow root. Both binders are
 * reference-counted, so binding once per draggable is safe. Returns a cleanup
 * that unbinds them.
 */
export function bindDraggableSensors(element: Element): DragCleanupFn {
  const root = getDragEventRoot(element);
  bindPointerListeners(root);
  bindKeyboardListeners(root);
  return onceCleanup(() => {
    unbindPointerListeners(root);
    unbindKeyboardListeners(root);
  });
}

export type DraggableConfig<TData = undefined> = {
  element: HTMLElement;
  /** CSP nonce for the drag cursor stylesheet, wired by the React layer. @internal */
  styleNonce?: string | undefined;
  /** Whether the React layer has disabled runtime style elements. @internal */
  disableStyleElements?: boolean | undefined;
  /**
   * The data to attach to this drag, surfaced as `source.payload` on every
   * drag-and-drop event. Functions are preserved as ordinary payload values.
   */
  // Optional here so the conditional requirement lives in one place: `Draggable.Root`
  // and `registerDraggable` re-impose it through an overload, which also keeps a
  // wrapper spreading their `Props` from hitting a deferred conditional.
  payload?: DraggablePayload<TData> | undefined;
  /**
   * Resolves the data attached to this drag at drag start. Use this instead of
   * `payload` when the value depends on the pickup gesture.
   */
  getPayload?: DraggablePayloadGetter<TData> | undefined;
  /**
   * Stable identity used to reconnect a settling cloned preview to this source
   * after it remounts. Use the same key for the same logical item across the move.
   * Static payload identity is used as a fallback when it is referentially stable.
   */
  previewKey?: string | number | undefined;
  /**
   * Human-readable name of this draggable, used by the default screen-reader
   * announcements for keyboard drags. Defaults to a generic "item".
   * For full control over the announcement text, use `keyboardAnnouncements` instead.
   */
  label?: string | undefined;
  /**
   * The drag kind created with `Draggable.createKind`. Drop targets and monitors
   * list accepted kinds in `accept`. The kind determines the type of `payload` and
   * `source.payload`.
   */
  kind: DragKind<TData>;
  /**
   * Restricts drag initiation to a specific child element, ref, or resolver.
   * The handle should be available when the draggable is registered so it receives
   * the gesture styles and keyboard attributes.
   *
   * For sources registered imperatively. A draggable component restricts pickup
   * by rendering a `Draggable.Handle` instead.
   */
  dragHandle?: DragHandle | undefined;
  /**
   * Restricts keyboard pickup to a specific child element, ref, or resolver without
   * restricting pointer pickup. Space and Enter start a drag only when this element
   * has focus. Omit it to use `dragHandle`, then the draggable element itself.
   *
   * For sources registered imperatively. A draggable component configures this by
   * rendering a `Draggable.KeyboardHandle` instead.
   */
  keyboardDragHandle?: DragHandle | undefined;
  /**
   * Whether to disable dragging. Pointer presses and keyboard events keep their
   * native behavior, and Base UI omits the keyboard-drag accessibility attributes.
   * Use `onBeforeDragStart` instead when the decision depends on the gesture.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called when a drag is about to start, once the activation condition
   * is met and before the preview is built and `getPayload` runs.
   * Call `eventDetails.cancel()` to prevent the drag from starting.
   */
  onBeforeDragStart?:
    | ((context: DragStartContext, eventDetails: BeforeDragStartEventDetails) => void)
    | undefined;
  /**
   * Determines when a pointer press starts a drag. Mouse and pen use a 5px distance
   * by default. Touch uses a 250ms press and hold. Pass one `DragActivation` for
   * every pointer type or a map with per-type values. See `keyboardActivation` for
   * keyboard pickup.
   */
  pointerActivation?: DragActivationConfig | undefined;
  /**
   * Screen-reader announcements for keyboard drags.
   * Merged over the defaults; omit a callback to keep its default.
   */
  keyboardAnnouncements?: DragKeyboardAnnouncements<NoInfer<TData>> | undefined;
  /**
   * Determines where focus moves after a keyboard drag. See
   * {@link DragKeyboardFinalFocus} for the supported values.
   * A pointer drag never moves focus.
   * @default true
   */
  finalFocus?: DragKeyboardFinalFocus<NoInfer<TData>> | undefined;
  /**
   * Value for `aria-roledescription` on the drag handle, announcing the
   * element as draggable to screen readers. Defaults to the text of the nearest
   * `LocalizationProvider`.
   */
  ariaRoleDescription?: string | undefined;
  /**
   * Text for the shared keyboard-drag instructions node, read by a screen reader when
   * the handle is focused. Defaults to the text of the nearest `LocalizationProvider`.
   */
  keyboardInstructions?: string | undefined;
  /**
   * How keyboard dragging is started. See {@link DragKeyboardActivation} for
   * the supported modes.
   * @default 'auto'
   */
  keyboardActivation?: DragKeyboardActivation | undefined;
  /**
   * Controls how arrow keys move a keyboard drag. See {@link DragKeyboardMovement}.
   * Ignored when `keyboardActivation` is `'off'`.
   */
  keyboardMovement?: DragKeyboardMovement<NoInfer<TData>> | undefined;
  /**
   * Constrains pointer and keyboard movement with one modifier or an array applied
   * in order. See {@link DragModifiers} and the exported modifier presets.
   */
  modifiers?: DragModifiers | undefined;
  /**
   * CSS cursor applied across the document during a pointer drag. The drag preview
   * has `pointer-events: none`, so otherwise the cursor would depend on the element
   * under the pointer. Touch drags ignore this value.
   * Pass `false` to manage the cursor yourself.
   * @default 'grabbing'
   */
  dragCursor?: string | false | undefined;
  /**
   * The content and DOM container of the drag preview.
   * Omit it to use a sanitized clone of the source. The clone preserves classes
   * and live element state, but rewrites IDs to keep the document unique.
   *
   * For sources registered imperatively. A draggable that renders a preview part
   * describes its preview there instead.
   */
  dragPreview?: DragPreviewParameters<NoInfer<TData>> | undefined;
  /**
   * The preview part declared for this draggable, if any. Wired by the React layer;
   * the engine reads it once at drag start, before React can run, to decide between
   * cloning the source and building a host for custom content.
   * @internal
   */
  getDragPreviewDeclaration?: (() => DragPreviewDeclaration<NoInfer<TData>> | null) | undefined;
  /**
   * Subtree default for `container`, from the nearest `Draggable.PreviewProvider`.
   * Wired by the React layer, which is the only thing that can see a provider; the
   * preview's own `container` wins over it.
   * @internal
   */
  previewContainerDefault?: DragPreviewContainer | undefined;

  /**
   * Event handler called once at the start of a drag, before `onDragStart`,
   * while the preview is being built. The React layer installs its preview
   * publisher here, so the public parameter types omit it.
   * @internal
   */
  onGenerateDragPreview?:
    | ((parameters: DragPreviewRenderEvent<NoInfer<TData>>) => void)
    | undefined;
  /**
   * Event handler called once, synchronously when the drag starts. The drag preview
   * has already been resolved by then, so it is safe to measure or restyle the
   * source from here.
   */
  onDragStart?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDragStart'],
        eventDetails: DragEventDetailsMap['onDragStart'],
      ) => void)
    | undefined;
  /**
   * Event handler called as the pointer or keyboard cursor moves, limited to one
   * call per animation frame. Drop target stack changes do not call this handler.
   * Use the drop target's `onDrag` for hover behavior.
   */
  onDrag?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDrag'],
        eventDetails: DragEventDetailsMap['onDrag'],
      ) => void)
    | undefined;
  /**
   * Event handler called when the active drop targets change,
   * because one was entered or left.
   */
  onDropTargetChange?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDropTargetChange'],
        eventDetails: DragEventDetailsMap['onDropTargetChange'],
      ) => void)
    | undefined;
  /**
   * Event handler called when the drag is released over an accepting drop target.
   * Commit the move here. `dropTarget` is never `null`. A drag that ends another
   * way calls only `onDragEnd`.
   */
  onDrop?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDrop'],
        eventDetails: DragEventDetailsMap['onDrop'],
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends after a drop, outside release, or
   * cancellation. Use it to clean up or revert optimistic state. Commit a drop from
   * `onDrop`. `eventDetails.reason` identifies the outcome.
   */
  onDragEnd?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDragEnd'],
        eventDetails: DragEventDetailsMap['onDragEnd'],
      ) => void)
    | undefined;
};
