import { type Store, createSelector } from '@base-ui-components/utils/store';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type FloatingRootContext } from '../floating-ui-react';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import { type PopoverOpenChangeReason } from './root/PopoverRootContext';
import { type HTMLProps } from '../utils/types';

export type State = {
  open: boolean;
  modal: boolean | 'trap-focus';
  mounted: boolean;

  activeTriggerElement: Element | null;
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
  modal: createSelector((state: State) => state.modal),
  mounted: createSelector((state: State) => state.mounted),

  activeTriggerElement: createSelector((state: State) => state.activeTriggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),
  popupElement: createSelector((state: State) => state.popupElement),
  triggers: createSelector((state: State) => state.triggers),

  instantType: createSelector((state: State) => state.instantType),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  openMethod: createSelector((state: State) => state.openMethod),
  openReason: createSelector((state: State) => state.openReason),

  titleId: createSelector((state: State) => state.titleId),
  descriptionId: createSelector((state: State) => state.descriptionId),

  floatingRootContext: createSelector((state: State) => state.floatingRootContext),

  payload: createSelector((state: State) => state.payload),

  triggerProps: createSelector((state: State) => state.triggerProps),
  popupProps: createSelector((state: State) => state.popupProps),
  stickIfOpen: createSelector((state: State) => state.stickIfOpen),
};
