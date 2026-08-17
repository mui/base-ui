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

/**
 * Per-element static-setup state, since multiple draggables can share a handle
 * element. The first registration captures the prior gesture styles and ARIA
 * attributes; only the last to clean up restores them. In between, the ARIA
 * attributes are reconciled on every registration and cleanup, so a keyboard-enabled
 * registrant following one that opted out of keyboard drag still lands them.
 */
interface StaticSetupHold {
  /**
   * The `aria-describedby` instruction id this registrant contributed, or `null`
   * when it has none to describe (`keyboardActivation: 'manual'` with no consumer text).
   * Such a hold still carries a role description.
   */
  instructionId: string | null;
  /** The `aria-roledescription` this registrant wants. */
  roleDescription: string;
}

interface StaticSetupEntry {
  count: number;
  /** Number of enabled registrants that need pointer-gesture styles. */
  gestureCount: number;
  /**
   * One entry per keyboard-enabled registrant, removed by identity so a registrant's
   * instruction id and role description are always dropped as the pair it
   * contributed. The element carries the ARIA attributes while this is non-empty,
   * with the most recent surviving registrant's role description winning.
   */
  holds: StaticSetupHold[];
  /** Apply the styles that prevent native text/touch gestures during pickup. */
  applyGestureStyles: () => void;
  /** Restore the consumer's gesture styles when no enabled registrant remains. */
  restoreGestureStyles: () => void;
  restore: DragCleanupFn;
  /** Apply the union of the current registrants' ARIA state to the element. */
  reconcile: () => void;
  /** Restore the captured `aria-roledescription` without touching gesture styles. */
  restoreRole: () => void;
}
// Through the shared slot like the engine's other registries: two bundled copies
// sharing a handle element would otherwise each snapshot the *other's* already-
// modified gesture styles, and the last restore would strand
// `touch-action: manipulation` / `user-select: none` on the node.
const staticSetups = getSharedSlot<WeakMap<Element, StaticSetupEntry>>(
  'draggable.staticSetups',
  () => new WeakMap<Element, StaticSetupEntry>(),
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
  // Required, already localization-resolved: the engine is the single home for
  // `?? translations.…` defaulting, so a second layer here can't drift out of sync.
  // Empty means "say nothing", which is what `keyboardActivation: 'manual'` resolves to.
  ariaRoleDescription: string;
  keyboardInstructions: string;
  keyboardActivation?: DragKeyboardActivation | undefined;
  disabled?: boolean | undefined;
}

/**
 * Single application of the static DOM setup: the gesture styles and the keyboard
 * a11y attributes. The handle is resolved once here; the setup is ref-counted per
 * element (see {@link staticSetups}). `keyboardActivation: 'off'` keeps only the
 * pointer gesture styles, while `disabled` applies neither styles nor attributes so
 * ordinary text and touch interaction remains available. `'manual'` keeps the role
 * description, and describes the pickup route only if the consumer wrote it.
 *
 * Hands back both halves: `release` undoes this registration's contribution, and
 * `reconcile` re-asserts the attributes it owns without re-running the setup. The
 * latter exists because the attributes are shared DOM the consumer also writes —
 * React rewriting a controlled `aria-describedby` drops the keyboard-instructions
 * idref, and only an idempotent re-apply puts it back.
 */
function applyStaticSetup(parameters: DraggableStaticSetupParameters): {
  release: DragCleanupFn;
  reconcile: () => void;
} {
  const { element, dragHandle, keyboardActivation, disabled } = parameters;

  // Resolve the handle to set up; drag-time logic re-resolves `dragHandle` for freshness.
  const initialDragHandle = resolveElementReference(dragHandle, undefined);
  const gestureElement = (initialDragHandle as HTMLElement | null) ?? element;

  // A disabled registration owns no static DOM at all. In particular, do not
  // capture a restoration snapshot: restoring fields the engine never changed
  // would overwrite consumer style/ARIA updates made while it stayed disabled.
  if (disabled) {
    return { release: () => {}, reconcile: () => {} };
  }

  // `hold === null` gates the attribute apply/restore below.
  const keyboardEnabled = (keyboardActivation ?? 'auto') !== 'off';
  // The instructions node is created relative to `gestureElement`, which is the node
  // that receives the `aria-describedby`: an ARIA IDREF cannot cross a shadow
  // boundary, so a handle inside a shadow root needs the node in *its* root. Empty
  // text buys no node — `'manual'` says nothing unless the consumer wrote it.
  const instructionsHold =
    keyboardEnabled && parameters.keyboardInstructions !== ''
      ? ensureKeyboardInstructions(gestureElement, parameters.keyboardInstructions)
      : null;
  if (keyboardEnabled) {
    // Pre-create the per-document live region while the draggable registers: screen
    // readers can drop an announcement written into a region that was inserted into
    // the document in the same tick. Unlike the ref-counted instructions node above,
    // the region is deliberately never torn down — see `getAnnouncer`.
    getAnnouncer(element);
  }

  // Kept as one object so the cleanup below removes this registrant's contributions
  // as a unit, by identity. A hold with no `instructionId` still claims the role
  // description: `'manual'` is draggable, just not by a key.
  const hold: StaticSetupHold | null = keyboardEnabled
    ? {
        instructionId: instructionsHold?.id ?? null,
        roleDescription: parameters.ariaRoleDescription,
      }
    : null;

  let entry = staticSetups.get(gestureElement);
  if (!entry) {
    const gestureStyle = gestureElement.style as CSSStyleDeclaration & Record<string, string>;
    const previous = {
      touchAction: gestureStyle.touchAction ?? '',
      userSelect: gestureStyle.userSelect ?? '',
      webkitUserSelect: gestureStyle.webkitUserSelect ?? '',
      webkitTouchCallout: gestureStyle.webkitTouchCallout ?? '',
    };
    // Captured once so cleanup can restore the exact pre-engine ARIA state.
    const hadRoleDescription = gestureElement.hasAttribute('aria-roledescription');
    const previousRoleDescription = gestureElement.getAttribute('aria-roledescription');

    const created: StaticSetupEntry = {
      count: 0,
      gestureCount: 0,
      holds: [],
      applyGestureStyles() {
        gestureStyle.touchAction = 'manipulation';
        gestureStyle.userSelect = 'none';
        gestureStyle.webkitUserSelect = 'none';
        gestureStyle.webkitTouchCallout = 'none';
      },
      restoreGestureStyles() {
        // Preserve style updates made while the element was registered.
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
      reconcile() {
        const existing = gestureElement.getAttribute('aria-describedby');
        if (created.holds.length > 0) {
          if (!hadRoleDescription || previousRoleDescription == null) {
            gestureElement.setAttribute(
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
            gestureElement.setAttribute('aria-describedby', nextDescribedBy);
          }
        }
      },
      restoreRole() {
        if (!hadRoleDescription) {
          gestureElement.removeAttribute('aria-roledescription');
        } else if (previousRoleDescription != null) {
          gestureElement.setAttribute('aria-roledescription', previousRoleDescription);
        }
      },
      restore() {
        created.restoreGestureStyles();
        created.restoreRole();
      },
    };
    entry = created;
    staticSetups.set(gestureElement, entry);
  }
  entry.count += 1;
  if (entry.gestureCount === 0) {
    entry.applyGestureStyles();
  }
  entry.gestureCount += 1;

  const activeEntry = entry;
  // Reconcile on *this* registration, not just the first, so a keyboard-enabled
  // registrant that follows a `keyboardActivation: 'off'` one — or a locale change
  // re-supplying the text — still lands the attributes.
  if (hold !== null) {
    activeEntry.holds.push(hold);
    activeEntry.reconcile();
  }

  const release = onceCleanup(() => {
    // Released before the entry guard below, which can bail out — the hold is this
    // registration's own either way.
    instructionsHold?.release();
    const current = staticSetups.get(gestureElement);
    if (current !== activeEntry) {
      return;
    }
    current.gestureCount -= 1;
    if (current.gestureCount === 0) {
      current.restoreGestureStyles();
    }
    if (hold !== null) {
      const index = current.holds.indexOf(hold);
      if (index !== -1) {
        current.holds.splice(index, 1);
      }
      // Keep the token when another surviving registrant references the same
      // instructions node (same text → same id). Without this per-token cleanup, a
      // handle shared by draggables with *different* instructions would strand the
      // earlier registrant's idref on `aria-describedby` when it unmounts.
      if (
        hold.instructionId !== null &&
        !current.holds.some((heldSetup) => heldSetup.instructionId === hold.instructionId)
      ) {
        const restoredDescribedBy = removeToken(
          gestureElement.getAttribute('aria-describedby'),
          hold.instructionId,
        );
        if (restoredDescribedBy) {
          gestureElement.setAttribute('aria-describedby', restoredDescribedBy);
        } else {
          gestureElement.removeAttribute('aria-describedby');
        }
      }
      if (current.holds.length === 0) {
        // Drop the engine's `aria-roledescription` too, but only if the element still
        // has other (keyboard-disabled) registrants keeping the entry alive;
        // otherwise `restore()` below handles the full teardown.
        if (current.count > 1) {
          current.restoreRole();
        }
      } else {
        // A keyboard-enabled registrant survives: re-apply its role description, so
        // unmounting a later registrant doesn't strand its own value.
        current.reconcile();
      }
    }
    current.count -= 1;
    if (current.count === 0) {
      staticSetups.delete(gestureElement);
      current.restore();
    }
  });

  return {
    release,
    // A registrant with no keyboard hold owns no attributes, so it has nothing to
    // re-assert.
    reconcile: () => {
      if (hold !== null && staticSetups.get(gestureElement) === activeEntry) {
        activeEntry.reconcile();
      }
    },
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
  let appliedGestureElement =
    (resolveElementReference(parameters.dragHandle, undefined) as HTMLElement | null) ?? element;
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
    const nextGestureElement =
      (resolveElementReference(latest.dragHandle, undefined) as HTMLElement | null) ?? element;
    if (nextKey === appliedKey && nextGestureElement === appliedGestureElement) {
      // Nothing about the setup's inputs changed, but the attributes it wrote are
      // shared DOM: a consumer-controlled `aria-describedby` rewritten by React
      // drops the keyboard-instructions idref, and a screen-reader user silently
      // loses the gesture hint for the rest of the page's life. The re-apply is
      // idempotent, so this costs an attribute read on an unchanged refresh.
      setup.reconcile();
      return;
    }
    appliedKey = nextKey;
    appliedGestureElement = nextGestureElement;
    setup.release();
    setup = applyStaticSetup({
      element,
      dragHandle: latest.dragHandle,
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
   * What this draggable is, created with `Draggable.createKind`. Drop targets and
   * monitors declare the kinds they take through their `accept`, and the kind's payload
   * type is what types `payload` and `source.payload` on every event.
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
   * Whether the element should ignore user interaction: a press behaves like an
   * ordinary click and Space/Enter keep their native behavior. The keyboard-drag
   * a11y attributes are also omitted, so screen readers don't announce a drag that
   * can't start. For a decision that needs the gesture context, use
   * `onBeforeDragStart` instead.
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
   * Determines when a press becomes a drag. Mouse and pen default to a 5px
   * distance, touch to a 250ms press-hold. Pass a single `DragActivation` to
   * apply to all pointer types, or a per-type map.
   * Keyboard pickup is separate: see `keyboardActivation`.
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
   * CSS cursor pinned across the whole document while a pointer drag is active.
   * The drag preview has `pointer-events: none`, so without this the cursor would
   * track whatever sits under the pointer. Touch drags ignore it.
   * Pass `false` to manage the cursor yourself.
   * @default 'grabbing'
   */
  dragCursor?: string | false | undefined;
  /**
   * The drag preview: what follows the pointer, and where it lives in the DOM.
   * Omit it and the source is cloned, in place.
   *
   * For sources registered imperatively. A draggable that renders a preview part
   * describes its preview there instead.
   */
  dragPreview?: DragPreviewParameters<NoInfer<TData>> | undefined;
  /**
   * The preview part declared for this draggable, if any. Wired by the React layer;
   * the engine reads it once at drag start, before React can run, to decide between
   * cloning the source and building a host to render into.
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
   * Event handler called, rAF-throttled, as the drag moves — a pointer move, or an
   * arrow press moving the keyboard drag's virtual cursor. Not dispatched on
   * drop-target-stack changes, so hover logic belongs on the drop target's
   * `onDrag`, not here.
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
   * Event handler called when the drag is released over an accepting drop target,
   * and only then — the place to commit the move. `dropTarget` is never `null` here.
   * A drag that ends any other way reaches `onDragEnd` alone.
   */
  onDrop?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDrop'],
        eventDetails: DragEventDetailsMap['onDrop'],
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends, however it ended — dropped,
   * released over nothing, or canceled. Use it to undo optimistic state and clean up;
   * commit the drop from `onDrop`. `eventDetails.reason` carries the exact outcome.
   */
  onDragEnd?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDragEnd'],
        eventDetails: DragEventDetailsMap['onDragEnd'],
      ) => void)
    | undefined;
};
