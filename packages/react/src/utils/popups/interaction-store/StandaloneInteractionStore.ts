import { ReactStore } from '@base-ui/utils/store';
import type { PopupInteractionContext, PositioningInteractionStore, ReferenceType } from '../types';
import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { createEventEmitter } from '../createEventEmitter';
import type { PopupTriggerMap } from '../popupTriggerMap';
import { dispatchOpenChange } from './dispatchOpenChange';
import type { TransitionStatus } from '../../../internals/useTransitionStatus';

export interface StandaloneInteractionState {
  open: boolean;
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
   * The popup's outermost element, usually its positioner.
   */
  outerPopupElement: HTMLElement | null;
  /**
   * An anchor set explicitly, such as the cursor position of a popup that follows it.
   */
  anchorOverride: ReferenceType | null;
  /**
   * The popup's id unless its element sets one.
   */
  defaultPopupId: string | undefined;
}

export interface StandaloneInteractionStoreContext extends PopupInteractionContext {
  onOpenChange:
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}

const selectors = {
  open: (state: StandaloneInteractionState) => state.open,
  transitionStatus: (state: StandaloneInteractionState) => state.transitionStatus,
  anchorElement: (state: StandaloneInteractionState) => state.anchorElement,
  anchor: (state: StandaloneInteractionState) => state.anchorOverride ?? state.baseAnchor,
  outerPopupElement: (state: StandaloneInteractionState) => state.outerPopupElement,
  defaultPopupId: (state: StandaloneInteractionState) => state.defaultPopupId,
};

interface StandaloneInteractionStoreOptions {
  open: boolean;
  transitionStatus: TransitionStatus | undefined;
  baseAnchor: ReferenceType | null;
  outerPopupElement: HTMLElement | null;
  triggerElements: PopupTriggerMap;
  defaultPopupId: string | undefined;
  nested: boolean;
  onOpenChange:
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}

export class StandaloneInteractionStore
  extends ReactStore<
    Readonly<StandaloneInteractionState>,
    StandaloneInteractionStoreContext,
    typeof selectors
  >
  implements PositioningInteractionStore
{
  constructor(options: StandaloneInteractionStoreOptions) {
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

  clearPositioning() {
    this.update({
      baseAnchor: null,
      outerPopupElement: null,
      anchorElement: null,
      anchorOverride: null,
    });
  }
}
