import { ReactStore } from '@base-ui/utils/store';
import type { PopupInteractionContext, PositioningInteractionStore, ReferenceType } from '../types';
import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { createEventEmitter } from '../createEventEmitter';
import type { PopupTriggerMap } from '../popupTriggerMap';
import { dispatchOpenChange } from './dispatchOpenChange';
import type { TransitionStatus } from '../../../internals/useTransitionStatus';

/**
 * The state of a `FloatingRootStore`, synced from the component that owns it.
 */
export interface FloatingRootState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * The popup's open or close transition. Owners don't sync it, so it stays `undefined`.
   */
  transitionStatus: TransitionStatus | undefined;
  /**
   * The DOM element the popup is anchored to.
   */
  anchorElement: Element | null;
  /**
   * The anchor the component passes, which `anchorOverride` takes precedence over.
   */
  baseAnchor: ReferenceType | null;
  /**
   * The popup's positioner element, or the popup itself when it has no positioner.
   */
  positionerElement: HTMLElement | null;
  /**
   * An anchor set explicitly, such as the cursor position of a popup that follows it.
   */
  anchorOverride: ReferenceType | null;
  /**
   * The popup's id unless its element sets one.
   */
  defaultPopupId: string | undefined;
}

/**
 * The non-reactive context of a `FloatingRootStore`: what the interaction hooks share, plus the
 * owner's open change callback.
 */
export interface FloatingRootStoreContext extends PopupInteractionContext {
  /**
   * Called after an open change is dispatched to the interaction hooks, so the owner can update
   * its own open state.
   */
  onOpenChange:
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}

const selectors = {
  open: (state: FloatingRootState) => state.open,
  transitionStatus: (state: FloatingRootState) => state.transitionStatus,
  anchorElement: (state: FloatingRootState) => state.anchorElement,
  anchor: (state: FloatingRootState) => state.anchorOverride ?? state.baseAnchor,
  positionerElement: (state: FloatingRootState) => state.positionerElement,
  defaultPopupId: (state: FloatingRootState) => state.defaultPopupId,
};

interface FloatingRootStoreOptions {
  open: boolean;
  transitionStatus: TransitionStatus | undefined;
  baseAnchor: ReferenceType | null;
  positionerElement: HTMLElement | null;
  triggerElements: PopupTriggerMap;
  defaultPopupId: string | undefined;
  nested: boolean;
  onOpenChange:
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}

/**
 * An interaction store for components without a popup store: Select, Combobox, Navigation Menu
 * and Toast. It holds a copy of the open state, anchor and elements that its owner syncs in from a
 * layout effect whenever they change (see `useFloatingRootStore`), and reports open changes back
 * through `onOpenChange`.
 */
export class FloatingRootStore
  extends ReactStore<Readonly<FloatingRootState>, FloatingRootStoreContext, typeof selectors>
  implements PositioningInteractionStore
{
  constructor(options: FloatingRootStoreOptions) {
    const { nested, onOpenChange, triggerElements, ...initialState } = options;

    super(
      {
        ...initialState,
        anchorOverride: initialState.baseAnchor,
        anchorElement: initialState.baseAnchor as Element | null,
      },
      {
        onOpenChange,
        events: createEventEmitter(),
        nested,
        triggerElements,
      },
      selectors,
    );
  }

  /**
   * Emits the `openchange` event through the internal event emitter and calls the `onOpenChange` handler with the provided arguments.
   *
   * @param newOpen The new open state.
   * @param eventDetails Details about the event that triggered the open state change.
   */
  setOpen = (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
    dispatchOpenChange(this.context, this.state.open, newOpen, eventDetails);
    this.context.onOpenChange?.(newOpen, eventDetails);
  };

  /**
   * Forgets the anchor and elements positioning reads while the popup isn't mounted, so
   * positioning doesn't run for a `keepMounted` popup that is closed.
   */
  clearPositioning() {
    this.update({
      baseAnchor: null,
      positionerElement: null,
      anchorElement: null,
      anchorOverride: null,
    });
  }
}
