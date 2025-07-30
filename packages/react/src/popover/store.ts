import { type Store, createSelector } from '@base-ui-components/utils/store';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type FloatingRootContext } from '../floating-ui-react';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import { type PopoverOpenChangeReason } from './root/PopoverRootContext';
import { type HTMLProps } from '../utils/types';

export type State = {
  modal: boolean | 'trap-focus';

  open: boolean;
  activeTriggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  popupElement: HTMLElement | null;
  triggers: Map<HTMLElement, (() => unknown) | undefined>;

  instantType: 'dismiss' | 'click' | undefined;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;
  openReason: PopoverOpenChangeReason | null;

  titleId: string | undefined;
  descriptionId: string | undefined;

  floatingRootContext: FloatingRootContext;

  payload: unknown | undefined;

  triggerProps: HTMLProps;
  popupProps: HTMLProps;
  stickIfOpen: boolean;
};

export type PopoverStore = Store<State>;

export const selectors = {
  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.activeTriggerElement !== null),

  activeTriggerElement: createSelector((state: State) => state.activeTriggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),
  popupElement: createSelector((state: State) => state.popupElement),
  triggers: createSelector((state: State) => state.triggers),

  instantType: createSelector((state: State) => state.instantType),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  openMethod: createSelector((state: State) => state.openMethod),
  openReason: createSelector((state: State) => state.openReason),

  modal: createSelector((state: State) => state.modal),
  stickIfOpen: createSelector((state: State) => state.stickIfOpen),
  floatingRootContext: createSelector((state: State) => state.floatingRootContext),

  titleId: createSelector((state: State) => state.titleId),
  descriptionId: createSelector((state: State) => state.descriptionId),

  payload: createSelector((state: State) => state.payload),

  triggerProps: createSelector((state: State) => state.triggerProps),
  popupProps: createSelector((state: State) => state.popupProps),
};
