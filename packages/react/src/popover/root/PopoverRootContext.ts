'use client';
import * as React from 'react';
import type { FloatingRootContext } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { HTMLProps } from '../../utils/types';
import type { InteractionType } from '../../utils/useEnhancedClickHandler';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';

export type PopoverOpenChangeReason = BaseOpenChangeReason | 'close-press';

export interface PopoverRootContext {
  open: boolean;
  openOnHover: boolean;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: PopoverOpenChangeReason | undefined,
  ) => void;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  delay: number;
  closeDelay: number;
  instantType: 'dismiss' | 'click' | undefined;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  floatingRootContext: FloatingRootContext;
  triggerProps: HTMLProps;
  popupProps: HTMLProps;
  openMethod: InteractionType | null;
  openReason: PopoverOpenChangeReason | null;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  modal: boolean | 'trap-focus';
}

export const PopoverRootContext = React.createContext<PopoverRootContext | undefined>(undefined);

export function usePopoverRootContext(optional?: false): PopoverRootContext;
export function usePopoverRootContext(optional: true): PopoverRootContext | undefined;
export function usePopoverRootContext(optional?: boolean) {
  const context = React.useContext(PopoverRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: PopoverRootContext is missing. Popover parts must be placed within <Popover.Root>.',
    );
  }
  return context;
}
