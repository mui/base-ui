'use client';
import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { PopupTriggerMap } from '../../utils/popups/popupTriggerMap';
import type { FullscreenRoot } from '../root/FullscreenRoot';
import type { FullscreenNavigationUI } from '../root/useFullscreenRoot';

/**
 * Reactive state held by `FullscreenStore`.
 *
 * Most fields are tracked reactively so detached triggers can subscribe to
 * `open`, `disabled`, `supported`, etc. without going through context.
 */
export type FullscreenStoreState = {
  /**
   * Whether the container is currently in fullscreen (internal state).
   */
  open: boolean;
  /**
   * Whether the container is currently in fullscreen (external prop).
   */
  readonly openProp: boolean | undefined;
  /**
   * ID of the trigger element that activated the fullscreen, if any.
   */
  activeTriggerId: string | null;
  /**
   * The trigger DOM element that activated the fullscreen, if any.
   */
  activeTriggerElement: Element | null;
  /**
   * Whether the Fullscreen API is supported by the container's owner document.
   */
  supported: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Hint forwarded to `Element.requestFullscreen()`.
   */
  navigationUI: FullscreenNavigationUI;
  /**
   * The id of the container element. Used by the trigger's `aria-controls`.
   */
  containerId: string | undefined;
  /**
   * Whether the root is using an external `target` element instead of a
   * `<Fullscreen.Container>`. Set by `useExternalFullscreenTarget` and used by
   * `<Fullscreen.Container>` to detect the misuse of being rendered alongside a
   * `target` prop.
   */
  hasExternalTarget: boolean;
};

/**
 * Non-reactive context held by `FullscreenStore`.
 */
export type FullscreenStoreContext = {
  /**
   * Reference to the container element that goes fullscreen.
   */
  readonly containerRef: React.MutableRefObject<HTMLElement | null>;
  /**
   * Map of registered trigger elements (used by detached triggers).
   */
  readonly triggerElements: PopupTriggerMap;
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: FullscreenRoot.ChangeEventDetails) => void)
    | undefined;
};

function getOpen(state: FullscreenStoreState) {
  return state.openProp ?? state.open;
}

const activeTriggerIdSelector = createSelector(
  (state: FullscreenStoreState) => state.activeTriggerId,
);

const selectors = {
  open: createSelector(getOpen),
  supported: createSelector((state: FullscreenStoreState) => state.supported),
  disabled: createSelector((state: FullscreenStoreState) => state.disabled),
  navigationUI: createSelector((state: FullscreenStoreState) => state.navigationUI),
  containerId: createSelector((state: FullscreenStoreState) => state.containerId),
  hasExternalTarget: createSelector((state: FullscreenStoreState) => state.hasExternalTarget),
  activeTriggerId: activeTriggerIdSelector,
  activeTriggerElement: createSelector((state: FullscreenStoreState) => state.activeTriggerElement),
  /**
   * Whether the trigger with the given id is currently the active trigger.
   */
  isTriggerActive: createSelector(
    (state: FullscreenStoreState, triggerId: string | undefined) =>
      triggerId !== undefined && activeTriggerIdSelector(state) === triggerId,
  ),
  /**
   * Whether the container is open and was activated by the trigger with the given id.
   */
  isOpenedByTrigger: createSelector(
    (state: FullscreenStoreState, triggerId: string | undefined) =>
      triggerId !== undefined && activeTriggerIdSelector(state) === triggerId && getOpen(state),
  ),
};

export type FullscreenStoreSelectors = typeof selectors;

export class FullscreenStore extends ReactStore<
  FullscreenStoreState,
  FullscreenStoreContext,
  FullscreenStoreSelectors
> {
  constructor(initialState?: Partial<FullscreenStoreState>) {
    super(
      createInitialState(initialState),
      {
        containerRef: { current: null },
        triggerElements: new PopupTriggerMap(),
        onOpenChange: undefined,
      },
      selectors,
    );
  }

  /**
   * Updates the open state, dispatching `onOpenChange` first.
   *
   * The actual browser API call (`requestFullscreen` / `exitFullscreen`) is
   * driven by the layout effect inside `useFullscreenRoot`, which subscribes
   * to the `open` selector and reacts to changes here.
   */
  public setOpen = (nextOpen: boolean, eventDetails: FullscreenRoot.ChangeEventDetails) => {
    this.context.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const updatedState: Partial<FullscreenStoreState> = {
      open: nextOpen,
    };

    if (nextOpen) {
      const newTriggerId = eventDetails.trigger?.id ?? null;
      updatedState.activeTriggerId = newTriggerId;
      updatedState.activeTriggerElement = eventDetails.trigger ?? null;
    }
    // We intentionally do not clear `activeTriggerId` on close so the last
    // active trigger keeps its `data-fullscreen` until a new one takes over.

    this.update(updatedState);
  };

  /**
   * Returns either the externally provided store (e.g. from a `Fullscreen.Handle`)
   * or a freshly created internal store seeded with the given initial state.
   */
  static useStore(
    externalStore: FullscreenStore | undefined,
    initialState?: Partial<FullscreenStoreState>,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const internalStore = useRefWithInit(() => {
      return new FullscreenStore(initialState);
    }).current;

    return externalStore ?? internalStore;
  }
}

function createInitialState(
  initialState: Partial<FullscreenStoreState> = {},
): FullscreenStoreState {
  return {
    open: false,
    openProp: undefined,
    activeTriggerId: null,
    activeTriggerElement: null,
    supported: true,
    disabled: false,
    navigationUI: 'auto',
    containerId: undefined,
    hasExternalTarget: false,
    ...initialState,
  };
}
