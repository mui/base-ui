import { createSelector } from '@base-ui/utils/store';
import { FloatingRootContext } from '../../floating-ui-react';
import { getEmptyRootContext } from '../../floating-ui-react/utils/getEmptyRootContext';
import { EMPTY_OBJECT } from '../constants';
import { TransitionStatus } from '../useTransitionStatus';
import { PopupTriggerMap } from './popupTriggerMap';
import { HTMLProps } from '../types';

/**
 * State common to all popup stores.
 */
export type PopupStoreState<Payload> = {
  /**
   * Whether the popup is open (internal state).
   */
  open: boolean;
  /**
   * Whether the popup is open (external prop).
   */
  readonly openProp: boolean | undefined;
  /**
   * Whether the popup should be mounted in the DOM.
   * This usually follows `open` but can be different during exit transitions.
   */
  mounted: boolean;
  /**
   * The current enter/exit transition status of the popup.
   */
  transitionStatus: TransitionStatus;

  floatingRootContext: FloatingRootContext;
  /**
   * Whether to prevent unmounting the popup when closed.
   * Useful for interactling with JS animation libraries that control unmounting themselves.
   */
  preventUnmountingOnClose: boolean;

  /**
   * Optional payload set by the trigger.
   */
  payload: Payload | undefined;

  /**
   * ID of the currently active trigger.
   */
  activeTriggerId: string | null;
  /**
   * The currently active trigger DOM element.
   */
  activeTriggerElement: Element | null;
  /**
   * ID of the trigger (external prop).
   */
  readonly triggerIdProp: string | null | undefined;
  /**
   * The popup DOM element.
   */
  popupElement: HTMLElement | null;
  /**
   * The positioner DOM element.
   */
  positionerElement: HTMLElement | null;

  /**
   * Props to spread onto the active trigger element.
   */
  activeTriggerProps: HTMLProps;
  /**
   * Props to spread onto inactive trigger elements.
   */
  inactiveTriggerProps: HTMLProps;
  /**
   * Props to spread onto the popup element.
   */
  popupProps: HTMLProps;
};

export function createInitialPopupStoreState<Payload>(): PopupStoreState<Payload> {
  return {
    open: false,
    openProp: undefined,
    mounted: false,
    transitionStatus: 'idle',
    floatingRootContext: getEmptyRootContext(),
    preventUnmountingOnClose: false,
    payload: undefined,
    activeTriggerId: null,
    activeTriggerElement: null,
    triggerIdProp: undefined,
    popupElement: null,
    positionerElement: null,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
  };
}

export type PopupStoreContext<ChangeEventDetails> = {
  /**
   * Map of registered trigger elements.
   */
  readonly triggerElements: PopupTriggerMap;
  /**
   * Reference to the popup element.
   */
  readonly popupRef: React.RefObject<HTMLElement | null>;
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?: ((open: boolean, eventDetails: ChangeEventDetails) => void) | undefined;
  /**
   * Callback fired when the open state change animation completes.
   */
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};

type S = PopupStoreState<unknown>;

const activeTriggerIdSelector = createSelector(
  (state: S) => state.triggerIdProp ?? state.activeTriggerId,
);

export const popupStoreSelectors = {
  open: createSelector((state: S) => state.openProp ?? state.open),
  mounted: createSelector((state: S) => state.mounted),
  transitionStatus: createSelector((state: S) => state.transitionStatus),
  floatingRootContext: createSelector((state: S) => state.floatingRootContext),
  preventUnmountingOnClose: createSelector((state: S) => state.preventUnmountingOnClose),
  payload: createSelector((state: S) => state.payload),

  activeTriggerId: activeTriggerIdSelector,
  activeTriggerElement: createSelector((state: S) =>
    state.mounted ? state.activeTriggerElement : null,
  ),
  /**
   * Whether the trigger with the given ID was used to open the popup.
   */
  isTriggerActive: createSelector(
    (state: S, triggerId: string | undefined) =>
      triggerId !== undefined && activeTriggerIdSelector(state) === triggerId,
  ),
  /**
   * Whether the popup is open and was activated by a trigger with the given ID.
   */
  isOpenedByTrigger: createSelector(
    (state: S, triggerId: string | undefined) =>
      triggerId !== undefined && activeTriggerIdSelector(state) === triggerId && state.open,
  ),
  /**
   * Whether the popup is mounted and was activated by a trigger with the given ID.
   */
  isMountedByTrigger: createSelector(
    (state: S, triggerId: string | undefined) =>
      triggerId !== undefined && activeTriggerIdSelector(state) === triggerId && state.mounted,
  ),

  triggerProps: createSelector((state: S, isActive: boolean) =>
    isActive ? state.activeTriggerProps : state.inactiveTriggerProps,
  ),
  popupProps: createSelector((state: S) => state.popupProps),

  popupElement: createSelector((state: S) => state.popupElement),
  positionerElement: createSelector((state: S) => state.positionerElement),
};

export type PopupStoreSelectors = typeof popupStoreSelectors;
