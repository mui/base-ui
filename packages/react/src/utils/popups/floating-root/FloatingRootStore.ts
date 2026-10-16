import { ReactStore } from '@base-ui/utils/store';
import type { PopupInteractionContext, PositioningInteractionStore, ReferenceType } from '../types';
import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { createEventEmitter } from '../createEventEmitter';
import type { PopupTriggerMap } from '../popupTriggerMap';
import { dispatchOpenChange } from './dispatchOpenChange';
import type { TransitionStatus } from '../../../internals/useTransitionStatus';

export interface FloatingRootState {
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
  popupPositionerElement: HTMLElement | null;
  /**
   * An anchor set explicitly, such as the cursor position of a popup that follows it.
   */
  anchorOverride: ReferenceType | null;
  /**
   * The popup's id unless its element sets one.
   */
  defaultPopupId: string | undefined;
}

export interface FloatingRootStoreContext extends PopupInteractionContext {
  onOpenChange:
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}

const selectors = {
  open: (state: FloatingRootState) => state.open,
  transitionStatus: (state: FloatingRootState) => state.transitionStatus,
  anchorElement: (state: FloatingRootState) => state.anchorElement,
  anchor: (state: FloatingRootState) => state.anchorOverride ?? state.baseAnchor,
  popupPositionerElement: (state: FloatingRootState) => state.popupPositionerElement,
  defaultPopupId: (state: FloatingRootState) => state.defaultPopupId,
};

interface FloatingRootStoreOptions {
  open: boolean;
  transitionStatus: TransitionStatus | undefined;
  baseAnchor: ReferenceType | null;
  popupPositionerElement: HTMLElement | null;
  triggerElements: PopupTriggerMap;
  defaultPopupId: string | undefined;
  nested: boolean;
  onOpenChange:
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}

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

  clearPositioning() {
    this.update({
      baseAnchor: null,
      popupPositionerElement: null,
      anchorElement: null,
      anchorOverride: null,
    });
  }
}
