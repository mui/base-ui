'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import {
  computeDropPosition as computeCollectionDropPosition,
  getDropCapabilities as getLegacyDropCapabilities,
  invalidateDirectionCache,
  treeDragPayloadBrand,
  type CollectionOrientation,
  type DragSourceData,
  type DropCapabilities,
  type DropPosition,
} from './collectionDrop';
import { reorderRowBrand, type ReorderRowBrand } from './reorderRow';
import { DragEngineImpl, resolveKeyboardInstructions } from './useInnerDragEngine';
import { useDragPreviewContext } from './overlay/DragPreviewContext';
import type { DragPreviewContext } from './overlay/DragPreviewContext';
import type {
  InternalDragEngine,
  InternalDraggableParameters,
  RegisterDropTargetParameters,
  RegisterMonitorParameters,
} from '../../types/dragRegistration';
import { getSharedSlot } from './sharedState';
import { dragSessionStore, selectors, updateDragSourceElement } from './dragSessionStore';
import { retargetActivePreviewSource } from './activePreview';
import { mergeKeyboardAnnouncements } from './a11y/defaultAnnouncements';
import { buildStaticSetupKey } from './draggable';
import { createKind, matchesAccept } from './dragKind';
import { scheduleDisplacementSweep, trackDisplacedElement } from './displacement';
import { getActiveHitElement } from './synthetic/syntheticSensor';
import type { LatestGetter } from './useRegistrationRef';
import { getComposedParentElement, isPointInRect, runAllCleanups } from './utils';
import type {
  DragKind,
  DragInput,
  DragSource,
  DragLocationHistory,
  DragPreviewSettings,
  DropTargetEvent,
  DropTargetResolutionContext,
  DragKeyboardAnnouncements,
  DragKeyboardMovement,
  DragKeyboardFinalFocusParameters,
  DragKeyboardActivation,
  DropTargetRecord,
} from '../../types/drag';
import type { CollectionActions, CollectionItemId } from '../../types/collection';
import { useTranslations } from '../../internals/localization-context/LocalizationContext';
import type { LocalizationProviderTranslations } from '../../localization-provider/types';
import { useCSPContext } from '../../internals/csp-context/CSPContext';
import type { CSPContextValue } from '../../internals/csp-context/CSPContext';

const DEFAULT_KIND = createKind<never>('base-ui-dnd-item');

/** The kinds a collection accepts for drops, normalized to an array. */
type IncomingKinds<TItem> = ReadonlyArray<DragKind<IncomingSourceData<TItem>>>;

function isKindArray<TPayload>(
  accept: DragKind<TPayload> | ReadonlyArray<DragKind<TPayload>>,
): accept is ReadonlyArray<DragKind<TPayload>> {
  return Array.isArray(accept);
}

/**
 * This collection's wire format as seen on an *incoming* drag. Any draggable of an
 * accepted kind reaches the monitor and the drop targets — including a plain
 * `Draggable.Root` carrying a scalar payload, or none — so neither the fields nor
 * the payload itself are guaranteed.
 */
type IncomingSourceData<TItem> = Partial<DragSourceData<TItem>> | undefined;

// Built fresh per call: the state object and its set are handed to consumers,
// and one stray mutation on a shared singleton would poison every later read.
function createInitialState(): DraggableCollectionState {
  return {
    draggedItemIds: new Set<CollectionItemId>(),
    dropTargetItemId: null,
    dropPosition: null,
  };
}

// Shared slot so a double-bundled engine shares one counter; two copies would
// otherwise collide on instance ids, breaking internal-drag detection.
const instanceIdSlot = getSharedSlot<{ next: number }>('useDraggableCollection.instanceId', () => ({
  next: 0,
}));

function getNextInstanceId() {
  instanceIdSlot.next += 1;
  return instanceIdSlot.next;
}

/** The subset of a plugin the origin needs to find a row another instance remounted. */
interface CommittedDropOwner {
  getItemElement(itemId: CollectionItemId): HTMLElement | undefined;
}

/**
 * The collection that committed the current drag's drop.
 *
 * A keyboard drag restores focus to the moved row, but for a cross-collection
 * move that row is remounted by the *destination* — while `finalFocus` runs on
 * the origin, whose `itemElements` never held it. Recorded at commit time (which
 * precedes the deferred focus restore) so the origin can reach across.
 * Shared-slot for the same reason as the instance-id counter.
 */
const committedDropSlot = getSharedSlot<{ owner: CommittedDropOwner | null }>(
  'useDraggableCollection.committedDrop',
  () => ({ owner: null }),
);

/** The subset of a plugin the origin needs to describe another instance's hovered row. */
interface LiveDropPositionOwner {
  itemLabel(itemId: CollectionItemId): string;
}

/**
 * The hovered row of the active drag: the plugin that owns it, and where the
 * drop would land relative to it.
 *
 * The keyboard announcements ride on the dragged item, so they come from the
 * ORIGIN plugin — but only the plugin owning the hovered row tracks its drop
 * position. On a cross-collection drag the origin's own tracking is cleared
 * when the drag leaves its rows, so the announcer reads the live position
 * through this slot and resolves the row's label through its owner (the
 * origin's item map doesn't know foreign rows). Reset at the next drag's
 * start, when the row is left, and when the owning plugin is destroyed.
 * Shared-slot for the same reason as the instance-id counter.
 */
const liveDropSlot = getSharedSlot<{
  owner: LiveDropPositionOwner | null;
  itemId: CollectionItemId | null;
  position: DropPosition | null;
}>('useDraggableCollection.liveDropPosition', () => ({
  owner: null,
  itemId: null,
  position: null,
}));

function clearLiveDropSlot(): void {
  liveDropSlot.owner = null;
  liveDropSlot.itemId = null;
  liveDropSlot.position = null;
}

export class DraggableCollectionPlugin<
  TItem,
  TActions extends CollectionActions<TItem> = CollectionActions<TItem>,
> {
  public static get initialState(): DraggableCollectionState {
    return createInitialState();
  }

  private readonly instanceId = getNextInstanceId();

  private readonly defaultKind = createKind<DragSourceData<TItem>>(
    `base-ui-tree-${this.instanceId}`,
  );

  private getConfig: LatestGetter<UseDraggableCollectionParameters<TItem, TActions>>;

  private getTranslations: LatestGetter<LocalizationProviderTranslations>;

  // The drag engine, so collection items, the root, the global monitor
  // and scroll containers all register through the same (global) engine as the rest
  // of the app. Built here from stable getters (rather than passed in) so the
  // plugin fully owns its registration path.
  private engine: InternalDragEngine;

  private monitorCleanup: (() => void) | null = null;

  /** See the `accept` getter: cached, keyed on the two inputs it derives from. */
  private acceptCache: IncomingKinds<TItem> | null = null;

  private acceptCacheConfigured: UseDraggableCollectionParameters<TItem, TActions>['accept'];

  private acceptCacheKind: DragKind<DragSourceData<TItem>> | null = null;

  // Dragged item ids, set by the global monitor.
  private currentDraggedItemIds: Set<CollectionItemId> = new Set();

  // Whether the drag was initiated by an item in this plugin's collection.
  private dragOriginatedHere = false;

  /**
   * The dragged rows' border boxes, captured at pickup by `onBeforeDragStart`.
   * Read by `isSelfRootDrop`, which must not depend on live layout the drag's own
   * `[data-dragging]` styles are allowed to collapse.
   */
  private draggedRects = new Map<CollectionItemId, DOMRect>();

  private lastDropPosition: DropPosition | null = null;

  private lastDropTargetItemId: CollectionItemId | null = null;

  private rootDropActive = false;

  // Whether this plugin published non-initial state since the last reset. Gates
  // the end-of-drag reset so uninvolved same-kind collections don't get a
  // redundant initial-state `onStateChange` on every drop.
  private hasNonInitialState = false;

  private currentDragItems: TItem[] = [];

  // Per-item root elements, kept fresh by `setupItem`. Used by keyboard focus
  // restoration to refocus a moved item after the drop commits.
  private itemElements = new Map<CollectionItemId, HTMLElement>();

  private itemIdsByElement = new WeakMap<Element, CollectionItemId>();

  private displacementCleanups = new Map<CollectionItemId, () => void>();

  // Per-item re-registration hooks, so `refreshItemsA11y` can re-apply the
  // registration-time static setup when `canDrag` or the locale changes.
  private itemRefreshers = new Map<CollectionItemId, (force?: boolean) => void>();

  private itemHandles = new Map<CollectionItemId, HTMLElement>();

  /** An a11y sweep requested mid-drag, deferred to drag end (see `refreshItemsA11y`). */
  private pendingA11yRefresh = false;

  constructor(
    getConfig: LatestGetter<UseDraggableCollectionParameters<TItem, TActions>>,
    getTranslations: LatestGetter<LocalizationProviderTranslations>,
    getPreviewContext: LatestGetter<DragPreviewContext | null>,
    getCSPContext: LatestGetter<CSPContextValue>,
  ) {
    this.getConfig = getConfig;
    this.getTranslations = getTranslations;
    this.engine = new DragEngineImpl(getTranslations, getPreviewContext, getCSPContext);
  }

  private get config(): UseDraggableCollectionParameters<TItem, TActions> {
    return this.getConfig();
  }

  private get translations(): LocalizationProviderTranslations {
    return this.getTranslations();
  }

  private get kind(): DragKind<DragSourceData<TItem>> {
    return (this.config.kind ?? (this.config.onDrop ? this.defaultKind : DEFAULT_KIND)) as DragKind<
      DragSourceData<TItem>
    >;
  }

  /**
   * Cached, and invalidated when the inputs it is derived from change.
   *
   * This getter is read once per `resolveDropTarget` *and* once per
   * `dispatchToDropTarget`, for every row — so on the keyboard path over a long
   * list a fresh array per read is hundreds of thousands of allocations a second,
   * for a value that only changes when the consumer re-declares `accept` or `kind`.
   */
  private get accept(): IncomingKinds<TItem> {
    const configured = this.config.accept;
    const kind = this.kind;
    if (
      this.acceptCache === null ||
      this.acceptCacheConfigured !== configured ||
      this.acceptCacheKind !== kind
    ) {
      this.acceptCacheConfigured = configured;
      this.acceptCacheKind = kind;
      let additional: ReadonlyArray<DragKind<IncomingSourceData<TItem>>> = [];
      if (configured !== undefined) {
        additional = isKindArray(configured) ? configured : [configured];
      }
      this.acceptCache = [kind as DragKind<IncomingSourceData<TItem>>, ...additional].filter(
        (entry, index, entries) => entries.indexOf(entry) === index,
      );
    }
    return this.acceptCache;
  }

  connect(): void {
    // Guard against a second connect() without an intervening destroy(), which
    // would otherwise leak the previously registered monitor.
    this.monitorCleanup?.();
    this.lastDropPosition = null;
    this.lastDropTargetItemId = null;
    this.rootDropActive = false;

    // Seed collections that mount during an accepted drag.
    const session = dragSessionStore.getSnapshot();
    const activeSource =
      session != null ? (session.source as DragSource<IncomingSourceData<TItem>>) : null;
    if (activeSource != null && matchesAccept(this.accept, activeSource)) {
      const src = activeSource.payload;
      this.currentDraggedItemIds = src?.itemIds ?? new Set();
      this.currentDragItems = src?.items ?? [];
      // Only the originating instance fires callbacks — recomputed rather than
      // hard-coded, so an instance remounting during its *own* drag (Strict
      // Mode, a wrapper remount) keeps firing them.
      this.dragOriginatedHere = src?.sourceInstanceId === this.instanceId;
      this.config.onStateChange?.({
        draggedItemIds: this.currentDraggedItemIds,
        dropTargetItemId: null,
        dropPosition: null,
      });
      this.hasNonInitialState = true;
    } else {
      this.config.onStateChange?.(createInitialState());
      this.hasNonInitialState = false;
    }

    const monitor: RegisterMonitorParameters<IncomingSourceData<TItem>> = {
      accept: this.accept,
      onDragStart: ({ source }) => {
        // Row `direction` is cached per drag; a locale switch between drags must
        // not keep resolving before/after against the old reading order.
        invalidateDirectionCache();
        committedDropSlot.owner = null;
        clearLiveDropSlot();
        const src = source.payload;
        const draggedItemIds = src?.itemIds ?? new Set<CollectionItemId>();
        this.currentDraggedItemIds = draggedItemIds;
        this.currentDragItems = src?.items ?? [];
        this.lastDropPosition = null;
        this.lastDropTargetItemId = null;
        this.rootDropActive = false;
        this.dragOriginatedHere = src?.sourceInstanceId === this.instanceId;

        // Only the plugin that owns the dragged items updates state and fires callbacks.
        if (this.dragOriginatedHere) {
          this.config.onStateChange?.({
            draggedItemIds,
            dropTargetItemId: null,
            dropPosition: null,
          });
          this.hasNonInitialState = true;
          this.config.onDragStart?.({
            itemIds: draggedItemIds,
            actions: this.config.getActions(),
            source: source as DragSource<unknown>,
          });
        }
      },
      onDragEnd: ({ source, location, dropTarget }) => {
        const src = source.payload;
        const draggedItemIds = this.currentDraggedItemIds;
        const actualTargetData = dropTarget?.payload;
        // Heterogeneous local data from any same-kind plugin; cast to our wire format.
        const targetData = actualTargetData as DropTargetItemData | undefined;
        // Item drops commit from the target's own `onDrop`, which the lifecycle
        // dispatches before this — see the item registration in `setupItem`.

        // Root drops match on `targetInstanceId` since `role: 'root'` is shared across same-kind instances.
        const isRootDrop =
          targetData?.role === 'root' && targetData.targetInstanceId === this.instanceId;
        // Releasing the dragged rows over their own footprint reaches the root
        // (see `isSelfRootDrop`) but commits nothing.
        const selfRootDrop = isRootDrop && this.isSelfRootDrop(src, location);

        // The collection surfaces a single `canceled` boolean to its consumers:
        // a drop landed (`dropTarget != null`) or it didn't (cancel / released
        // outside / released over the dragged rows' own footprint).
        const canceled = dropTarget == null || selfRootDrop;

        // Where the drop landed, not whether a handler ran: a valid internal drop
        // managed entirely through `onStateChange` has no configured callback and
        // would otherwise report `isInternal: false`.
        const isInternal =
          !canceled && targetData != null && targetData.targetInstanceId === this.instanceId;

        const dragItems = this.currentDragItems;
        if (this.hasNonInitialState) {
          this.config.onStateChange?.(createInitialState());
          this.hasNonInitialState = false;
        }
        this.currentDraggedItemIds = new Set();
        this.currentDragItems = [];
        this.draggedRects.clear();
        this.rootDropActive = false;

        if (draggedItemIds.size > 0 && this.dragOriginatedHere) {
          this.config.onDragEnd?.({
            itemIds: draggedItemIds,
            items: dragItems,
            isInternal,
            canceled,
            actions: this.config.getActions(),
            source: source as DragSource<unknown>,
            dropTarget: dropTarget ?? null,
          });
        }

        // Flush an a11y sweep deferred mid-drag. This dispatch runs before the
        // lifecycle's teardown nulls the session, so defer one microtask and
        // re-check rather than re-deferring immediately.
        if (this.pendingA11yRefresh) {
          queueMicrotask(() => {
            if (this.pendingA11yRefresh && dragSessionStore.getSnapshot() === null) {
              this.refreshItemsA11y();
            }
          });
        }
      },
    };
    this.monitorCleanup = this.engine.registerMonitor(() => {
      monitor.accept = this.accept;
      return monitor;
    });
  }

  destroy(): void {
    this.monitorCleanup?.();
    this.monitorCleanup = null;
    // Release the shared slots this instance owns, or the next drag's focus
    // restore / announcements would reach into a destroyed plugin's item maps.
    if (committedDropSlot.owner === this) {
      committedDropSlot.owner = null;
    }
    if (liveDropSlot.owner === this) {
      clearLiveDropSlot();
    }
    this.currentDraggedItemIds = new Set();
    this.currentDragItems = [];
    // Keep the pickup footprints while this instance's own drag is live: a
    // remount mid-own-drag (Strict Mode re-running the effect) re-`connect`s the
    // same plugin, and `connect` can reseed the ids from the session but cannot
    // re-measure the rects: a `[data-dragging]` rule may have the rows
    // `display: none`, the very case the snapshot exists for. Without it a
    // put-back release would fall through to the root target and reparent the rows.
    const liveSource = dragSessionStore.getSnapshot()?.source.payload as
      | IncomingSourceData<TItem>
      | undefined;
    if (liveSource?.sourceInstanceId !== this.instanceId) {
      this.draggedRects.clear();
    }
  }

  /**
   * Whether the active drag was started by an item of this collection.
   * `false` when no drag is in progress, or when a same-kind drag from another
   * collection is merely hovering this one (which also publishes the dragged
   * ids through `onStateChange` for its drop-state updates).
   */
  public isDragOrigin = (): boolean => {
    return this.dragOriginatedHere && this.currentDraggedItemIds.size > 0;
  };

  /** Whether an engine source was created by this collection instance. */
  public isSourceInternal = (
    source: DragSource<unknown>,
  ): source is DragSource<DragSourceData<TItem>> => {
    const payload = source.payload as Partial<DragSourceData<TItem>> | undefined;
    return payload?.sourceInstanceId === this.instanceId;
  };

  /** Whether a source carries this collection's declared item model. */
  public isSourceOwnKind = (
    source: DragSource<unknown>,
  ): source is DragSource<DragSourceData<TItem>> => {
    return source.kind === this.kind.id;
  };

  /** Requests a FLIP measurement after a managed live mutation. */
  public scheduleDisplacementSweep = (requester?: HTMLElement): void => {
    if (this.config.trackDisplacement) {
      scheduleDisplacementSweep(requester);
    }
  };

  /** Reconciles mounted rows when collection-level displacement tracking changes. */
  public refreshDisplacementTracking(): void {
    for (const [itemId, element] of this.itemElements) {
      this.syncDisplacementTracking(itemId, element);
    }
  }

  private syncDisplacementTracking(itemId: CollectionItemId, element: HTMLElement): void {
    this.displacementCleanups.get(itemId)?.();
    this.displacementCleanups.delete(itemId);
    if (this.config.trackDisplacement) {
      this.displacementCleanups.set(itemId, trackDisplacedElement(element));
    }
  }

  /**
   * Re-register every item's draggable so the registration-time static setup
   * (gesture styles, keyboard a11y attributes) reflects the current `canDrag`,
   * `keyboardActivation`, and locale strings. An item that is the active drag
   * source is skipped — its teardown would disrupt the live gesture.
   *
   * Each item re-registers only when its own setup inputs actually changed
   * (see `itemA11yKey`), so this stays cheap enough to call on every render —
   * the caller can't tell an inline `canDrag` (new identity each render) from a
   * real change.
   */
  refreshItemsA11y(): void {
    // A11y attributes are irrelevant mid-drag, and each sweep costs O(N)
    // consumer `canDrag` calls — during a drag, every hover-position render
    // would otherwise pay it. Defer to drag end: the monitor's `onDragEnd`
    // flushes (covering the actively dragged item, whose per-item refresh is
    // skipped mid-drag), and any later render retries too.
    if (dragSessionStore.getSnapshot() !== null) {
      this.pendingA11yRefresh = true;
      return;
    }
    this.pendingA11yRefresh = false;
    for (const refresh of this.itemRefreshers.values()) {
      refresh();
    }
  }

  /**
   * The inputs feeding an item's registration-time static setup, flattened to a
   * comparable string. The collection declares no per-item aria/instruction
   * overrides, so the strings come from the locale, through the same resolver the
   * engine applies — `keyboardActivation: 'manual'` drops the default instructions.
   */
  private itemA11yKey(itemId: CollectionItemId): string {
    return buildStaticSetupKey({
      disabled: this.config.canDrag ? !this.config.canDrag(itemId) : false,
      keyboardActivation: this.config.keyboardActivation,
      ariaRoleDescription: this.translations.dragRoleDescription,
      keyboardInstructions: resolveKeyboardInstructions(
        { keyboardActivation: this.config.keyboardActivation },
        this.translations,
      ),
    });
  }

  /**
   * A virtualizer can remount the dragged row to a fresh node mid-drag. Re-point
   * the live session at it, exactly as `Draggable.Root` does for a standalone
   * source: otherwise the drag keeps reporting the detached element,
   * `data-dragging` stays behind on it, and the replacement row renders undragged.
   *
   * The outgoing node comes from the session rather than `itemElements`, which
   * `Draggable.Root` solves with a survivor ref: React runs the previous effect's
   * cleanup — which forgets the map entry — before this setup, so the map never
   * holds the node being replaced.
   */
  private retargetActiveSource(itemId: CollectionItemId, element: HTMLElement): void {
    const session = dragSessionStore.state;
    if (session == null) {
      return;
    }
    const payload = session.source.payload as DragSourceData<TItem> | undefined;
    if (payload?.sourceInstanceId !== this.instanceId || payload.draggedItemId !== itemId) {
      return;
    }
    const previous = session.source.element;
    if (previous !== element && updateDragSourceElement(previous, element)) {
      retargetActivePreviewSource(element);
    }
  }

  /** Registers a secondary visual copy as a drop target without making it draggable. */
  setupDropTarget(itemId: CollectionItemId, element: HTMLElement): () => void {
    // Only the innermost item drives the indicator. DOM-nested ancestors fire
    // too, but the drop commits against `dropTargets[0]`.
    const trackDropPosition = (
      event: DropTargetEvent<'onDrag', IncomingSourceData<TItem>, DropTargetItemData>,
    ) => {
      const { source, location } = event;
      if (location.current.dropTargets[0]?.element !== element) {
        return;
      }
      const { input } = location.current;
      const position = this.computeDropPosition(element, input, source.payload);
      this.updateDropState(itemId, position);
    };

    const itemPayload: DropTargetItemData = {
      ...reorderRowBrand,
      role: 'item',
      itemId,
      targetInstanceId: this.instanceId,
    };
    const itemCanDrop = ({
      source,
      input,
    }: DropTargetResolutionContext<IncomingSourceData<TItem>>): boolean => {
      const src = source.payload;
      const draggedItemIds = src?.itemIds;
      // Without managed rows or a consumer drop handler, no drop can commit.
      if (draggedItemIds == null && this.config.onDrop == null) {
        return false;
      }
      const isDraggedItem = draggedItemIds?.has(itemId) || src?.draggedItemId === itemId;
      if (isDraggedItem && !this.config.allowDropOnDraggedItems) {
        return false;
      }
      // Cross-kind drops have no collection shape this instance can validate.
      if (
        this.kind.matches(source as DragSource<unknown>) &&
        draggedItemIds != null &&
        this.config.isDropTargetInvalid?.(itemId, draggedItemIds)
      ) {
        return false;
      }
      const capabilities = this.dropCapabilities(src);
      if (!capabilities.hasOn && !capabilities.hasBeforeAfter) {
        return false;
      }
      if (this.config.canDrop) {
        const position = this.computeDropPosition(element, input, src);
        if (
          !this.config.canDrop({
            draggedItemIds: draggedItemIds ?? new Set(),
            targetItemId: itemId,
            position,
            source: source as DragSource<unknown>,
          })
        ) {
          return false;
        }
      }
      return true;
    };

    const registration: RegisterDropTargetParameters<
      IncomingSourceData<TItem>,
      DropTargetItemData
    > = {
      accept: this.accept,
      payload: itemPayload,
      canDrop: itemCanDrop,
      onDragEnter: trackDropPosition,
      onDrag: trackDropPosition,
      onDragLeave: () => {
        this.clearDropState();
      },
      onDrop: ({ source, location }) => {
        this.handleDrop(location, source as DragSource<IncomingSourceData<TItem>>);
      },
    };
    return this.engine.registerDropTarget(element, () => {
      registration.accept = this.accept;
      return registration;
    });
  }

  setupItem(itemId: CollectionItemId, element: HTMLElement): () => void {
    this.retargetActiveSource(itemId, element);
    this.itemElements.set(itemId, element);
    this.itemIdsByElement.set(element, itemId);
    this.syncDisplacementTracking(itemId, element);

    let pendingDraggedItemIds: Set<CollectionItemId> | null = null;
    const onBeforeDragStart = () => {
      pendingDraggedItemIds = this.resolveDraggedItemIds(itemId);
      // Unioned with the grabbed row for the same reason `canDrop` checks it
      // separately: pruning can drop it from the set, and the self-drop
      // footprint has to cover the row the user is actually holding.
      this.snapshotDraggedRects(new Set([itemId, ...pendingDraggedItemIds]));
    };
    const getPayload = () => {
      const itemIdsSet = pendingDraggedItemIds ?? this.resolveDraggedItemIds(itemId);
      pendingDraggedItemIds = null;
      const actions = this.config.getActions();
      const items = actions.getItemModels([...itemIdsSet]) ?? [];
      const draggedItem = actions.getItemModels([itemId])[0];
      let removed = false;
      return {
        itemIds: itemIdsSet,
        draggedItemId: itemId,
        items,
        draggedItem,
        sourceInstanceId: this.instanceId,
        remove: () => {
          if (!removed) {
            removed = this.config.removeItems?.(itemIdsSet) ?? false;
          }
        },
        [treeDragPayloadBrand]: true,
      } satisfies DragSourceData<TItem>;
    };
    let lastConfig: UseDraggableCollectionParameters<TItem, TActions> | null = null;
    let lastTranslations: LocalizationProviderTranslations | null = null;
    let lastLabel: string | null = null;
    let lastDisabled = false;
    let parametersCache: InternalDraggableParameters<DragSourceData<TItem>> | null = null;

    const registerItemDraggable = () =>
      this.engine.registerDraggable<DragSourceData<TItem>>(
        element,
        () => {
          const config = this.config;
          const translations = this.translations;
          const dragPreview = config.dragPreview;
          const kind = this.kind;
          const disabled = config.canDrag ? !config.canDrag(itemId) : false;
          const label = this.itemLabel(itemId);
          const keyboardActivation = config.keyboardActivation;
          const keyboardMovement = config.keyboardMovement;
          const ariaRoleDescription = translations.dragRoleDescription;
          if (
            parametersCache !== null &&
            config === lastConfig &&
            translations === lastTranslations &&
            label === lastLabel &&
            disabled === lastDisabled
          ) {
            return parametersCache;
          }

          const parameters: InternalDraggableParameters<DragSourceData<TItem>> = {
            kind,
            pointerDragHandle: () => this.itemHandles.get(itemId) ?? null,
            // Besides supplying the source's accessible name, this gives the
            // settling clone a stable identity when a cross-collection move
            // remounts the item under a new registration. The `getPayload` callback
            // is necessarily a new function in the destination collection.
            label,
            // `canDrag(itemId)` is declarative (no gesture context), so it maps to
            // `disabled`: a locked item keeps its native long-press context menu
            // and nested `<img>`/`<a>` drags and drops the keyboard-drag a11y hints,
            // instead of arming the pending phase only to veto it at commit.
            disabled,
            keyboardActivation,
            keyboardAnnouncements: this.keyboardAnnouncements,
            keyboardMovement,
            finalFocus: this.finalFocus,
            ariaRoleDescription,
            // Unset on purpose: the engine resolves it from `keyboardActivation` and the
            // locale, and passing the default here would shadow that resolution.
            keyboardInstructions: undefined,
            // Dispatched before the preview is built and before `[data-dragging]`
            // lands, which is the only moment the rows are guaranteed to still be
            // laid out — a consumer rule may legitimately `display: none` the
            // source. See `isSelfRootDrop`, which needs their footprints.
            onBeforeDragStart,
            getPayload,
            // The collection owns its preview: it renders into the provider's
            // overlay, so it survives the dragged item reordering or unmounting.
            // Without one, the item falls back to the engine's default clone.
            // The wrapper (for example `Tree.DragPreview`) supplies the content and
            // the placement settings, mirroring `Draggable.Preview`.
            dragPreview: dragPreview && {
              render: ({ source }) => {
                const src = source.payload;
                return dragPreview.render({
                  itemIds: src.itemIds ?? new Set(),
                  draggedItemId: src.draggedItemId,
                  actions: this.config.getActions(),
                });
              },
              offset: dragPreview.offset,
              modifiers: dragPreview.modifiers,
              disabled: dragPreview.disabled,
              container: dragPreview.container,
            },
          };
          lastConfig = config;
          lastTranslations = translations;
          lastLabel = label;
          lastDisabled = disabled;
          parametersCache = parameters;
          return parameters;
        },
        true,
      );

    let draggableCleanup = registerItemDraggable();
    let a11yKey = this.itemA11yKey(itemId);
    // The registration-time static setup goes stale when `canDrag` or the locale
    // changes; `refreshItemsA11y` re-registers to re-apply it. Never for the
    // active drag source — the teardown would restore the gesture styles under
    // the live drag. `refreshItemsA11y` already defers wholesale while a drag is
    // live; the source check below keeps this closure safe on its own.
    const refreshA11y = (force = false) => {
      // Re-registration is a full registry remove/add plus sensor rebind, so
      // compare the setup inputs first: the caller can't distinguish an inline
      // `canDrag` (new identity every render) from a real change, and during a
      // drag every hovered-row render would otherwise re-register all N items.
      const nextKey = this.itemA11yKey(itemId);
      if (!force && nextKey === a11yKey) {
        return;
      }
      if (selectors.isDraggingElement(dragSessionStore.state, element)) {
        return;
      }
      a11yKey = nextKey;
      draggableCleanup();
      draggableCleanup = registerItemDraggable();
    };
    this.itemRefreshers.set(itemId, refreshA11y);

    const dropTargetCleanup = this.setupDropTarget(itemId, element);

    return () => {
      // Only forget the element/refresher if a newer `setupItem` hasn't already
      // replaced them (React can mount the next element before unmounting the old one).
      if (this.itemElements.get(itemId) === element) {
        this.itemElements.delete(itemId);
        this.displacementCleanups.get(itemId)?.();
        this.displacementCleanups.delete(itemId);
      }
      if (this.itemRefreshers.get(itemId) === refreshA11y) {
        this.itemRefreshers.delete(itemId);
      }
      if (this.itemIdsByElement.get(element) === itemId) {
        this.itemIdsByElement.delete(element);
      }
      // `draggableCleanup` is re-assigned by `refreshA11y`, so read it late.
      runAllCleanups([() => draggableCleanup(), dropTargetCleanup]);
    };
  }

  setupRoot(element: HTMLElement): () => void {
    const trackRootDrop = ({
      source,
      location,
    }: DropTargetEvent<'onDrag', IncomingSourceData<TItem>>) => {
      if (location.current.dropTargets[0]?.element !== element) {
        return;
      }
      if (this.isPointInDraggedFootprint(source.payload, location.current.input)) {
        if (this.rootDropActive || this.lastDropTargetItemId != null) {
          this.clearDropState();
        }
        return;
      }
      if (liveDropSlot.owner === this) {
        clearLiveDropSlot();
      }
      this.lastDropTargetItemId = null;
      this.lastDropPosition = null;
      if (this.rootDropActive) {
        return;
      }
      this.rootDropActive = true;
      this.config.onStateChange?.({
        draggedItemIds: this.currentDraggedItemIds,
        dropTargetItemId: null,
        dropPosition: 'root',
      });
      this.hasNonInitialState = true;
    };

    const registration: RegisterDropTargetParameters<
      IncomingSourceData<TItem>,
      DropTargetItemData
    > = {
      accept: this.accept,
      payload: {
        role: 'root',
        targetInstanceId: this.instanceId,
      },
      canDrop: ({ source }) =>
        this.config.canDropRoot?.(source as DragSource<unknown>) ??
        (this.config.onDrop != null || this.config.onRootDrop != null),
      onDragEnter: trackRootDrop,
      onDrag: trackRootDrop,
      onDragLeave: () => {
        if (this.rootDropActive) {
          this.clearDropState();
        }
      },
      onDrop: ({ source, location }) => {
        const src = source.payload;

        // Ignore releases over the dragged rows.
        if (this.isSelfRootDrop(src, location)) {
          return;
        }

        const actions = this.config.getActions();
        const onDrop = this.config.onDrop;
        let committed = false;
        if (onDrop != null) {
          committed =
            onDrop({
              itemIds: src?.itemIds ?? new Set(),
              items: src?.items ?? [],
              target: { itemId: null, position: 'root' },
              isInternal: src?.sourceInstanceId === this.instanceId,
              source: source as DragSource<unknown>,
              actions,
            }) !== false;
        } else if (this.config.onRootDrop != null) {
          this.config.onRootDrop({
            itemIds: src?.itemIds ?? new Set(),
            items: src?.items ?? [],
            actions,
          });
          committed = true;
        }
        // Keep keyboard focus restoration with the collection that committed the drop.
        if (committed) {
          committedDropSlot.owner = this;
        }
      },
    };
    return this.engine.registerDropTarget(element, () => {
      registration.accept = this.accept;
      return registration;
    });
  }

  setupHandle(itemId: CollectionItemId, element: HTMLElement): () => void {
    this.itemHandles.set(itemId, element);
    this.itemRefreshers.get(itemId)?.(true);
    return () => {
      if (this.itemHandles.get(itemId) === element) {
        this.itemHandles.delete(itemId);
        this.itemRefreshers.get(itemId)?.(true);
      }
    };
  }

  setupScroller(_element: HTMLElement): () => void {
    // Ordinary collection scrollers are discovered from the active pointer/source
    // ancestry. Keeping them out of the explicit global registry avoids measuring
    // every mounted collection on every auto-scroll frame.
    return () => {};
  }

  /** See {@link LiveDropPositionOwner}. */
  itemLabel(itemId: CollectionItemId): string {
    return this.config.getItemLabel?.(itemId) ?? String(itemId);
  }

  /** How many items the drag carries; announcements use it to agree in number. */
  private draggedCount(data: DragSourceData<TItem>): number {
    return data.itemIds?.size ?? 1;
  }

  private describeDragged(data: DragSourceData<TItem>): string {
    const count = this.draggedCount(data);
    return count > 1
      ? this.translations.dragMultipleItemsLabel({ count })
      : this.itemLabel(data.draggedItemId);
  }

  private positionPhrase(): string | null {
    // The live position lives in the shared slot (see {@link liveDropSlot}):
    // on a cross-collection drag only the plugin owning the hovered row tracks
    // it, and that owner also resolves the row's label. The phrase template
    // still comes from this (origin) plugin's translations, matching the rest
    // of the announcement.
    if (
      liveDropSlot.owner != null &&
      liveDropSlot.itemId != null &&
      liveDropSlot.position != null
    ) {
      return this.translations.dragDropPositionPhrase({
        position: liveDropSlot.position,
        target: liveDropSlot.owner.itemLabel(liveDropSlot.itemId),
      });
    }
    // The slot's owner may have been destroyed mid-drag; own tracking still
    // covers a same-collection hover.
    if (this.lastDropTargetItemId == null || this.lastDropPosition == null) {
      return null;
    }
    const target = this.itemLabel(this.lastDropTargetItemId);
    return this.translations.dragDropPositionPhrase({
      position: this.lastDropPosition,
      target,
    });
  }

  // Collection-aware defaults: label- and position-phrase-enriched strings from
  // the active `LocalizationProvider`.
  private defaultAnnouncements: Required<DragKeyboardAnnouncements<DragSourceData<TItem>>> = {
    pickedUp: (parameters) =>
      this.translations.dragAnnouncementPickedUp({
        label: this.describeDragged(parameters.source.payload),
        count: this.draggedCount(parameters.source.payload),
      }),
    moved: (parameters) =>
      this.translations.dragAnnouncementMoved({
        label: this.describeDragged(parameters.source.payload),
        count: this.draggedCount(parameters.source.payload),
        positionPhrase: this.positionPhrase(),
      }),
    dropped: (parameters) =>
      this.translations.dragAnnouncementDropped({
        label: this.describeDragged(parameters.source.payload),
        count: this.draggedCount(parameters.source.payload),
        positionPhrase: this.positionPhrase(),
        hasDropTarget: parameters.location.current.dropTargets.length > 0,
      }),
    canceled: (parameters) =>
      this.translations.dragAnnouncementCanceled({
        label: this.describeDragged(parameters.source.payload),
        count: this.draggedCount(parameters.source.payload),
      }),
    reachedEdge: () => null,
  };

  // A consumer-supplied `keyboardAnnouncements` override wins per phase
  // (including one returning `null` to stay silent); an omitted callback keeps
  // the collection-aware default above.
  private keyboardAnnouncements: DragKeyboardAnnouncements<DragSourceData<TItem>> =
    mergeKeyboardAnnouncements<DragSourceData<TItem>>(
      () => this.config.keyboardAnnouncements,
      () => this.defaultAnnouncements,
    );

  private finalFocus = (
    parameters: DragKeyboardFinalFocusParameters<DragSourceData<TItem>>,
  ): HTMLElement | true => {
    // Refocus the moved item's root once the reorder has remounted it; fall back
    // to the default behavior (handle / source) when it can't be found. A
    // cross-collection move remounts the row in the destination, so ask whoever
    // committed the drop when this collection no longer holds it.
    const itemId = parameters.source.payload.draggedItemId;
    const element =
      this.itemElements.get(itemId) ?? committedDropSlot.owner?.getItemElement(itemId);
    if (element && element.isConnected) {
      return element;
    }
    return true;
  };

  // ---- Private helpers -----------------------------------------------------

  private clearDropState() {
    // Reset drop metadata so a hovered target doesn't leak into a later drag phase.
    // Only the slot this plugin owns: leaves dispatch before enters, so on a
    // row-to-row move the entered row's plugin re-establishes ownership after.
    if (liveDropSlot.owner === this) {
      clearLiveDropSlot();
    }
    this.lastDropTargetItemId = null;
    this.lastDropPosition = null;
    this.rootDropActive = false;
    if (this.hasNonInitialState) {
      this.config.onStateChange?.({
        draggedItemIds: this.currentDraggedItemIds,
        dropTargetItemId: null,
        dropPosition: null,
      });
      this.hasNonInitialState = false;
    }
  }

  // The collection owner decides which positions are meaningful. Origin is read
  // from the payload rather than monitor state because initial target resolution
  // can run before this plugin's monitor receives drag start.
  private dropCapabilities(src: IncomingSourceData<TItem>): DropCapabilities {
    const isInternal = src?.sourceInstanceId === this.instanceId;
    return (
      this.config.getDropCapabilities?.({ isInternal }) ??
      getLegacyDropCapabilities(this.config, isInternal ? 'internal' : 'external')
    );
  }

  private computeDropPosition(
    element: HTMLElement,
    input: { clientX: number; clientY: number },
    src: IncomingSourceData<TItem>,
  ): DropPosition {
    const orientation = this.config.orientation ?? 'vertical';
    const clientPosition = orientation === 'horizontal' ? input.clientX : input.clientY;
    return computeCollectionDropPosition(
      element,
      clientPosition,
      this.dropCapabilities(src),
      orientation,
    );
  }

  /**
   * Whether a drop that reached the collection root was released over one of the
   * dragged rows' own footprint. The dragged rows reject themselves as targets
   * (`canDrop`), so such a release falls through to the root — but the user
   * meant "put it back", not "drop on the root's empty area".
   */
  private isSelfRootDrop(src: IncomingSourceData<TItem>, location: DragLocationHistory): boolean {
    return this.isPointInDraggedFootprint(src, location.current.input, true);
  }

  private isPointInDraggedFootprint(
    src: IncomingSourceData<TItem>,
    input: DragInput,
    checkConnectedGeometry = false,
  ): boolean {
    if (src?.sourceInstanceId !== this.instanceId || src.itemIds == null) {
      return false;
    }
    if (input.pointerType !== null) {
      for (let node = getActiveHitElement(); node !== null; node = getComposedParentElement(node)) {
        const itemId = this.itemIdsByElement.get(node);
        if (itemId !== undefined && (src.itemIds.has(itemId) || src.draggedItemId === itemId)) {
          return true;
        }
      }
      // The per-frame pointer path is fully answered by the hit ancestry above.
      // Terminal drop resolution opts into the geometry fallback because the
      // sensor has already released its active hit element by then.
      if (!checkConnectedGeometry) {
        return false;
      }
    }
    // The grabbed row is unioned in: `itemIds` is the *pruned* set, which can
    // legitimately exclude it (select a folder and a file inside it, then grab the
    // file), and the row the user is holding is exactly the one they can release
    // back onto.
    const isInsideItem = (id: CollectionItemId) => {
      // Prefer the live rect, which stays valid across scrolling — including this
      // engine's own auto-scroll. `draggedRects` are viewport-coordinate rects
      // frozen at pickup, so any scroll during the drag invalidates them, and
      // preferring them unconditionally makes a put-back fall through to
      // the root target and silently reparent the row to the root level.
      //
      // The snapshot is still the fallback, for the case it exists for: a
      // `display: none` source measures as a degenerate rect, and reading that
      // live would turn every put-back into a root drop.
      const live = this.liveItemRect(id);
      // Both dimensions, not either: a row collapsed on one axis mid-drag (an
      // animating height, a `[data-dragging]` rule) still reports a usable width,
      // and treating that as a live footprint puts the pointer outside it and
      // turns the put-back into a root drop — the case the snapshot exists for.
      const rect = live && live.width > 0 && live.height > 0 ? live : this.draggedRects.get(id);
      return rect != null && isPointInRect(input.clientX, input.clientY, rect);
    };
    for (const id of src.itemIds) {
      if (isInsideItem(id)) {
        return true;
      }
    }
    if (
      src.draggedItemId !== undefined &&
      !src.itemIds.has(src.draggedItemId) &&
      isInsideItem(src.draggedItemId)
    ) {
      return true;
    }
    return false;
  }

  /** The rows a drag started on `itemId` carries: the multi-selection, or just it. */
  private resolveDraggedItemIds(itemId: CollectionItemId): Set<CollectionItemId> {
    const selected = this.config.getActions().getSelectedItemIds() ?? new Set();
    if (selected.size > 1 && selected.has(itemId)) {
      // Copy *before* pruning, and again after: a consumer's
      // `getSelectedItemIds()` may hand back its live, mutable set, and the
      // documented default `pruneDraggedItems` returns its input unchanged — so
      // passing the live set straight through would make `itemIds` alias the
      // consumer's selection and change under the drag.
      const snapshot = new Set(selected);
      return this.config.pruneDraggedItems
        ? new Set(this.config.pruneDraggedItems(snapshot))
        : snapshot;
    }
    return new Set([itemId]);
  }

  private liveItemRect(itemId: CollectionItemId): DOMRect | null {
    const element = this.itemElements.get(itemId);
    return element?.isConnected ? element.getBoundingClientRect() : null;
  }

  /** Capture the dragged rows' footprints while they are still laid out. */
  private snapshotDraggedRects(itemIds: Set<CollectionItemId>): void {
    this.draggedRects.clear();
    for (const id of itemIds) {
      const rect = this.liveItemRect(id);
      if (rect) {
        this.draggedRects.set(id, rect);
      }
    }
  }

  private updateDropState(targetItemId: CollectionItemId, position: DropPosition) {
    // Published even when unchanged for this plugin — cheap, and it
    // re-establishes ownership when another instance's (DOM-nested) row was
    // hovered in between without this plugin's row ever leaving the stack.
    liveDropSlot.owner = this;
    liveDropSlot.itemId = targetItemId;
    liveDropSlot.position = position;

    // Skip the redundant `onStateChange` when (target, position) is unchanged so a
    // consumer wiring it to `setState` doesn't re-render the collection ~60x/s within one row.
    if (targetItemId === this.lastDropTargetItemId && position === this.lastDropPosition) {
      return;
    }

    this.lastDropTargetItemId = targetItemId;
    this.lastDropPosition = position;
    this.rootDropActive = false;

    this.config.onStateChange?.({
      draggedItemIds: this.currentDraggedItemIds,
      dropTargetItemId: targetItemId,
      dropPosition: position,
    });
    this.hasNonInitialState = true;
  }

  private handleDrop(location: DragLocationHistory, source: DragSource<IncomingSourceData<TItem>>) {
    const src = source.payload;
    // A collection can mount mid-drag (a panel revealed while dragging): its item
    // targets register synchronously in ref callbacks, but `connect()`, which
    // seeds the dragged ids and items, runs in a passive effect. A drop landing
    // in that gap performs the seed itself from the event's own payload rather
    // than silently no-op on a target the drop indicator showed as valid.
    if (this.currentDraggedItemIds.size === 0 && src?.itemIds != null) {
      this.currentDraggedItemIds = new Set(src.itemIds);
      this.currentDragItems = src.items ?? [];
    }
    const draggedItemIds = this.currentDraggedItemIds;
    if (draggedItemIds.size === 0 && src?.sourceInstanceId === this.instanceId) {
      return;
    }

    // Recompute target and position from the fresh drop event coordinates
    // rather than using the last rAF-throttled values, which may be stale.
    const topDropTarget = location.current.dropTargets[0];
    // Cast heterogeneous local data to our wire format (see onDrop).
    const targetData = topDropTarget ? (topDropTarget.payload as DropTargetItemData) : undefined;
    const targetItemId =
      targetData?.role === 'item' ? targetData.itemId : this.lastDropTargetItemId;
    const position =
      topDropTarget && targetItemId != null
        ? this.computeDropPosition(
            topDropTarget.element as HTMLElement,
            location.current.input,
            src,
          )
        : this.lastDropPosition;

    if (targetItemId == null || position == null) {
      return;
    }

    // Snapshot the actions once; the collection can't mutate within this synchronous drop handler.
    const actions = this.config.getActions();

    if (!actions.hasItem(targetItemId)) {
      return;
    }

    // Origin is instance identity, not id membership: separate collections can
    // legitimately reuse the same item ids.
    const isInternal = src?.sourceInstanceId === this.instanceId;
    if (isInternal) {
      for (const id of draggedItemIds) {
        // An internal drop whose rows were removed mid-drag has nothing to move.
        if (!actions.hasItem(id)) {
          return;
        }
      }
    }
    const onDrop = this.config.onDrop;
    let committed: boolean;
    if (onDrop != null) {
      committed =
        onDrop({
          itemIds: draggedItemIds,
          items: this.currentDragItems,
          target: { itemId: targetItemId, position },
          isInternal,
          actions,
          source,
        }) !== false;
    } else if (isInternal) {
      committed = this.handleInternalDrop(draggedItemIds, targetItemId, position, actions);
    } else {
      committed = this.handleExternalDrop(draggedItemIds, targetItemId, position, actions);
    }
    // This collection now owns the moved rows; the origin's `finalFocus` reads
    // this to find a row it never mounted itself. Claimed only when a handler
    // actually committed, so a no-op route can't point focus at a collection
    // that moved nothing.
    if (committed) {
      committedDropSlot.owner = this;
    }
  }

  /** See {@link CommittedDropOwner}. */
  getItemElement(itemId: CollectionItemId): HTMLElement | undefined {
    return this.itemElements.get(itemId);
  }

  private handleInternalDrop(
    itemIds: Set<CollectionItemId>,
    targetItemId: CollectionItemId,
    position: DropPosition,
    actions: TActions,
  ): boolean {
    if (this.config.onMove) {
      this.config.onMove({ itemIds, target: { itemId: targetItemId, position }, actions });
      return true;
    }
    if (position === 'on') {
      return this.routeItemDrop(itemIds, targetItemId, true, actions);
    }
    if (this.config.onReorder) {
      this.config.onReorder({ itemIds, target: { itemId: targetItemId, position }, actions });
      return true;
    }
    return false;
  }

  private routeItemDrop(
    itemIds: Set<CollectionItemId>,
    targetItemId: CollectionItemId,
    isInternal: boolean,
    actions: TActions,
  ): boolean {
    if (!this.config.onItemDrop) {
      return false;
    }
    this.config.onItemDrop({
      itemIds,
      items: this.currentDragItems,
      target: { itemId: targetItemId },
      isInternal,
      actions,
    });
    return true;
  }

  private handleExternalDrop(
    itemIds: Set<CollectionItemId>,
    targetItemId: CollectionItemId,
    position: DropPosition,
    actions: TActions,
  ): boolean {
    if (position === 'on') {
      return this.routeItemDrop(itemIds, targetItemId, false, actions);
    }
    if (this.config.onInsert) {
      this.config.onInsert({
        itemIds,
        items: this.currentDragItems,
        target: { itemId: targetItemId, position },
        actions,
      });
      return true;
    }
    return false;
  }
}

/**
 * Wires a collection (Tree, Kanban, ListBox…) into the drag engine. Returns a
 * `DraggableCollectionPlugin` whose setup methods are wired by the collection
 * wrapper to register draggables, drop targets, handles, and scrollers.
 */
export function useDraggableCollection<
  TItem = unknown,
  TActions extends CollectionActions<TItem> = CollectionActions<TItem>,
>(params: UseDraggableCollectionParameters<TItem, TActions>) {
  if (process.env.NODE_ENV !== 'production' && params.onMove && params.onReorder) {
    warn(
      'Base UI: a collection was given both `onReorder` and `onMove`. ' +
        '`onMove` subsumes `onReorder`, so `onReorder` will never fire. ' +
        'Provide one or the other.',
    );
  }
  const getConfig = useStableCallback(() => params);

  // Accessibility strings come from the nearest `LocalizationProvider`; kept in
  // a ref so a language change reaches the next drag's announcements without
  // re-creating the plugin.
  const translations = useTranslations();
  const getTranslations = useStableCallback(() => translations);

  // The plugin builds its own drag engine from this ref (see its constructor). The
  // engine is global, so the collection itself needs no provider — but an item
  // preview with content renders in a `Draggable.PreviewProvider`'s tree, so a
  // collection that declares one needs it. Staged so a provider change reaches the
  // next drag without re-creating the plugin.
  const previewContext = useDragPreviewContext();
  const cspContext = useCSPContext();
  const getPreviewContext = useStableCallback(() => previewContext);
  const getCSPContext = useStableCallback(() => cspContext);

  const plugin = useRefWithInit(
    () =>
      new DraggableCollectionPlugin<TItem, TActions>(
        getConfig,
        getTranslations,
        getPreviewContext,
        getCSPContext,
      ),
  );

  useIsoLayoutEffect(() => {
    const instance = plugin.current;
    instance.connect();
    return () => instance.destroy();
  }, [plugin]);

  // The items' static a11y setup (gesture styles, `aria-roledescription`,
  // keyboard instructions) is captured at registration; re-apply it when the
  // inputs that feed it change — `canDrag` (mapped to `disabled`),
  // `keyboardActivation`, or the active locale's strings — mirroring
  // `Draggable.Root`'s reconcile path. `canDrag` and `translations` are commonly
  // passed inline, so these deps fire on most renders; `refreshItemsA11y`
  // re-registers only the items whose own setup inputs actually changed.
  useIsoLayoutEffect(() => {
    plugin.current.refreshItemsA11y();
  }, [params.canDrag, params.keyboardActivation, translations, plugin]);

  useIsoLayoutEffect(() => {
    plugin.current.refreshDisplacementTracking();
  }, [params.trackDisplacement, plugin]);

  return plugin.current;
}

/** Returns the Base UI translations used by the collection adapter. */
export function useDraggableCollectionTranslations(): LocalizationProviderTranslations {
  return useTranslations();
}

// Local-data shape attached to drop targets via `payload`. `role` discriminates
// item vs root; a root carries its instance id so cross-instance monitors can route the drop.
type DropTargetItemData =
  | (ReorderRowBrand & {
      role: 'item';
      itemId: CollectionItemId;
      // Carried so cross-instance monitors route the drop to the owning
      // collection. Two same-kind lists can share item ids (1..n), so `itemId`
      // alone would let a cross-list drop pass both monitors and double-commit.
      targetInstanceId: number;
    })
  | {
      role: 'root';
      targetInstanceId: number;
    };

export interface OnReorderParameters<TActions = unknown> {
  itemIds: Set<CollectionItemId>;
  target: { itemId: CollectionItemId; position: 'before' | 'after' };
  actions: TActions;
}

export interface OnMoveParameters<TActions = unknown> {
  itemIds: Set<CollectionItemId>;
  target: { itemId: CollectionItemId; position: DropPosition };
  actions: TActions;
}

export interface OnInsertParameters<TItem, TActions = unknown> {
  itemIds: Set<CollectionItemId>;
  items: TItem[];
  target: { itemId: CollectionItemId; position: 'before' | 'after' };
  actions: TActions;
}

export interface OnItemDropParameters<TItem, TActions = unknown> {
  itemIds: Set<CollectionItemId>;
  items: TItem[];
  target: { itemId: CollectionItemId };
  isInternal: boolean;
  actions: TActions;
}

export interface OnRootDropParameters<TItem, TActions = unknown> {
  itemIds: Set<CollectionItemId>;
  items: TItem[];
  actions: TActions;
}

export interface CollectionDropParameters<TItem, TActions = unknown> {
  /** The ids carried by a collection source, or an empty set for a generic source. */
  itemIds: Set<CollectionItemId>;
  /** The models carried by a collection source, or an empty array for a generic source. */
  items: TItem[];
  /** The normalized row or root location that accepted the drop. */
  target: { itemId: CollectionItemId; position: DropPosition } | { itemId: null; position: 'root' };
  /** Whether the drag originated from this exact collection instance. */
  isInternal: boolean;
  /** The actions supplied by the collection owner. */
  actions: TActions;
  /** The engine source, including its typed kind and payload. */
  source: DragSource<unknown>;
}

/** Parameters for the collection's `canDrop` predicate. */
export interface CanDropParameters {
  /** The ids of the items being dragged. */
  draggedItemIds: Set<CollectionItemId>;
  /** The item the drop would land on or beside. */
  targetItemId: CollectionItemId;
  /** Where the drop would land relative to `targetItemId`. */
  position: DropPosition;
  /** The engine drag source being considered. */
  source: DragSource<unknown>;
}

export interface OnDragStartParameters<TActions = unknown> {
  /**
   * The ids of the items being dragged.
   */
  itemIds: Set<CollectionItemId>;
  /**
   * The actions provided by the collection wrapper (for example `Tree.DragProvider`).
   */
  actions: TActions;
  /** The engine drag source. */
  source: DragSource<unknown>;
}

export interface OnDragEndParameters<TItem, TActions = unknown> {
  /**
   * The ids of the items that were being dragged.
   */
  itemIds: Set<CollectionItemId>;
  /**
   * The models of the items that were dragged, resolved from the source collection.
   */
  items: TItem[];
  /**
   * Whether the drop occurred within the same collection that initiated the drag.
   */
  isInternal: boolean;
  /**
   * Whether the drag ended without a drop — `true` when it was aborted (Escape,
   * drop outside the window, or release over no valid target), `false` when an
   * item was dropped on a valid target.
   */
  canceled: boolean;
  /**
   * The actions provided by the collection wrapper (for example `Tree.DragProvider`).
   */
  actions: TActions;
  /** The engine drag source. */
  source: DragSource<unknown>;
  /** The innermost engine drop target, or `null` when canceled. */
  dropTarget: DropTargetRecord | null;
}

/**
 * The drag preview declared by a collection wrapper. Carries the content
 * (`render`) plus the same placement settings as `Draggable.Preview`
 * (`offset`, `modifiers`, `disabled`, `container`).
 */
export interface CollectionDragPreview<TActions = unknown> extends DragPreviewSettings {
  /**
   * Renders the preview content, replacing the default clone of the dragged item.
   * Return `null` (or `false`) to show no preview for that drag.
   */
  render: (parameters: RenderDragPreviewParameters<TActions>) => React.ReactNode;
}

export interface RenderDragPreviewParameters<TActions = unknown> {
  /**
   * The ids of the items being dragged.
   */
  itemIds: Set<CollectionItemId>;
  /**
   * The id of the specific item the user grabbed to initiate the drag.
   */
  draggedItemId: CollectionItemId;
  /**
   * The actions provided by the collection wrapper (for example `Tree.DragProvider`).
   */
  actions: TActions;
}

export interface DraggableCollectionState {
  /**
   * The items currently being dragged (empty set when not dragging).
   */
  draggedItemIds: Set<CollectionItemId>;
  /**
   * The item currently hovered as a drop target, or `null`.
   */
  dropTargetItemId: CollectionItemId | null;
  /** The active item placement, `'root'` for the collection root, or `null`. */
  dropPosition: DropPosition | 'root' | null;
}

export interface UseDraggableCollectionParameters<
  TItem = unknown,
  TActions extends CollectionActions<TItem> = CollectionActions<TItem>,
> {
  /** Legacy callback for reordering within one collection. */
  onReorder?: ((parameters: OnReorderParameters<TActions>) => void) | undefined;
  /** Legacy callback for moving within one collection. */
  onMove?: ((parameters: OnMoveParameters<TActions>) => void) | undefined;
  /** Legacy callback for inserting items from another collection. */
  onInsert?: ((parameters: OnInsertParameters<TItem, TActions>) => void) | undefined;
  /** Legacy callback for dropping directly on an item. */
  onItemDrop?: ((parameters: OnItemDropParameters<TItem, TActions>) => void) | undefined;
  /** Legacy callback for dropping on the collection root. */
  onRootDrop?: ((parameters: OnRootDropParameters<TItem, TActions>) => void) | undefined;
  /**
   * Receives the normalized item/root drop after final-coordinate resolution.
   * Return `false` when no mutation committed, so focus restoration does not
   * transfer ownership to this collection.
   */
  onDrop?: ((parameters: CollectionDropParameters<TItem, TActions>) => boolean | void) | undefined;
  /** Chooses whether the collection root participates for a source. */
  canDropRoot?: ((source: DragSource<unknown>) => boolean) | undefined;
  /** Chooses which row placements participate for internal and foreign sources. */
  getDropCapabilities?: ((parameters: { isInternal: boolean }) => DropCapabilities) | undefined;
  /**
   * Whether a given item can be dragged.
   *
   * Re-evaluated for every mounted item in a layout effect whenever its identity
   * changes, so on large non-virtualized collections prefer a referentially
   * stable (or cheap) callback over an inline closure.
   * @default () => true
   */
  canDrag?: ((itemId: CollectionItemId) => boolean) | undefined;
  /**
   * How a keyboard drag is started on an item.
   *
   * - `'auto'`: Space or Enter picks the focused item up.
   * - `'manual'`: Only `useDragDropManager().startKeyboardDrag()` picks an item up, freeing
   *   Space and Enter for another action such as inline editing while items stay
   *   focusable and announced as draggable.
   * - `'off'`: Items are only pointer-draggable, and the keyboard-drag screen reader
   *   hints are omitted.
   * @default 'auto'
   */
  keyboardActivation?: DragKeyboardActivation | undefined;
  /**
   * Whether a drop is allowed at a given (target item, position) pair.
   *
   * Returning `false` removes this item from the active drop-target stack —
   * a parent target underneath (for example the collection root, or an outer
   * collection in nested setups) gets a chance to claim the drop instead.
   * If you want "reject the drop entirely" semantics, return `false` from
   * `canDropRoot` too so the fall-through has nowhere to land.
   */
  canDrop?: ((parameters: CanDropParameters) => boolean) | undefined;
  /**
   * Keeps dragged rows registered as drop targets. Live-reordering collections can use this to
   * retain the current placement when DOM reordering moves a dragged row under the pointer.
   * @default false
   */
  allowDropOnDraggedItems?: boolean | undefined;
  /**
   * The drag preview for items of this collection: the content that follows the
   * pointer and how it is placed. Omit it to clone the dragged item in place (the
   * engine default). The content renders in a React tree, so the collection
   * wrapper (for example `Tree.DragProvider`) must render a `DragPreviewContext`
   * provider around the collection.
   */
  dragPreview?: CollectionDragPreview<TActions> | undefined;
  /**
   * Called when a drag operation starts.
   */
  onDragStart?: ((parameters: OnDragStartParameters<TActions>) => void) | undefined;
  /**
   * Called when a drag operation ends (drop or cancel).
   */
  onDragEnd?: ((parameters: OnDragEndParameters<TItem, TActions>) => void) | undefined;
  /**
   * What items dragged out of this collection are, created with
   * `Draggable.createKind`. Maps directly to the engine-level `kind` on every source
   * registered by `setupItem`, which other drop targets and monitors declare in their
   * `accept`.
   * @default createKind('base-ui-dnd-item')
   */
  kind?: DragKind<DragSourceData<TItem>> | undefined;
  /**
   * Which source kinds this collection accepts for drops. Defaults to the
   * collection's own `kind` (accepts its own items only). Pass a kind, or an array of
   * them, to allow specific external kinds.
   */
  accept?:
    | DragKind<IncomingSourceData<TItem>>
    | ReadonlyArray<DragKind<IncomingSourceData<TItem>>>
    | undefined;
  /** Removes the source models when a Tree payload's `remove()` method is called. */
  removeItems?: ((itemIds: ReadonlySet<CollectionItemId>) => boolean) | undefined;
  /** Tracks rows for live-reorder displacement animation. */
  trackDisplacement?: boolean | undefined;
  /**
   * The axis along which items are laid out, used to resolve the before/after
   * drop position from the pointer. Use `'horizontal'` for horizontally-laid-out
   * sortables (the position is read from `clientX` instead of `clientY`).
   * @default 'vertical'
   */
  orientation?: CollectionOrientation | undefined;
  /**
   * Called when the drag-and-drop state changes (drag start, hover, drop,
   * etc.). Also fires once at mount with the initial empty state so consumers
   * can synchronise from a known baseline; pass a stable function reference
   * (or one wrapped in `useStableCallback`) if the initial fire would otherwise
   * trigger work you don't want repeated on every render.
   *
   * During a matching drag that originated in *another* collection instance,
   * `draggedItemIds` carries the foreign drag's ids (so "N items incoming" UIs
   * can respond); those ids are only meaningful within their source instance —
   * don't use them to mark this collection's own rows as dragged.
   */
  onStateChange?: ((state: DraggableCollectionState) => void) | undefined;
  /**
   * Given a set of selected item IDs being dragged, returns a pruned set
   * that removes redundant items.
   * For example, a tree removes descendants when their ancestor is also in the set.
   * @default Returns the input set unchanged.
   */
  pruneDraggedItems?: ((itemIds: Set<CollectionItemId>) => Set<CollectionItemId>) | undefined;
  /**
   * Returns whether a drop target should be rejected given the dragged items.
   * For example, a tree returns `true` if the target is a descendant of any dragged item.
   * @default () => false
   */
  isDropTargetInvalid?:
    | ((dropTargetItemId: CollectionItemId, draggedItemIds: Set<CollectionItemId>) => boolean)
    | undefined;
  /**
   * Human-readable label for an item, used in keyboard-drag screen-reader
   * announcements ("Grabbed Buy milk", "Buy milk before Walk dog"). Falls back
   * to the stringified id.
   */
  getItemLabel?: ((itemId: CollectionItemId) => string) | undefined;
  /**
   * Override keyboard-drag screen-reader announcements. A supplied callback
   * fully replaces the collection's label-aware default for that phase (return
   * `null` to stay silent); omit a callback to keep its default.
   */
  keyboardAnnouncements?: DragKeyboardAnnouncements<DragSourceData<TItem>> | undefined;
  /**
   * Controls how arrow keys move a keyboard drag of the collection's items,
   * replacing the engine's default per-press movement. See the draggable
   * `keyboardMovement` option for the return-value contract.
   */
  keyboardMovement?: DragKeyboardMovement<DragSourceData<TItem>> | undefined;
  /**
   * Returns the actions object used internally by the plugin to query items
   * and injected into every callback's parameters.
   */
  getActions: () => TActions;
}

export type UseDraggableCollectionReturnValue = DraggableCollectionPlugin<unknown>;

export namespace useDraggableCollection {
  export type Parameters<
    TItem = unknown,
    TActions extends CollectionActions<TItem> = CollectionActions<TItem>,
  > = UseDraggableCollectionParameters<TItem, TActions>;

  export type ReturnValue = UseDraggableCollectionReturnValue;
}
