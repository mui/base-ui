import type {
  UseFloatingOptions as UsePositionOptions,
  UseFloatingReturn as UsePositionFloatingReturn,
  VirtualElement,
} from '@floating-ui/react-dom';
import type * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';

import type { FloatingTreeStore } from './tree/FloatingTreeStore';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { PopupTriggerMap } from './popupTriggerMap';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Delay = number | Partial<{ open: number; close: number }>;

export type NarrowedElement<T> = T extends Element ? T : Element;

export interface ExtendedRefs {
  reference: React.RefObject<ReferenceType | null>;
  floating: React.RefObject<HTMLElement | null>;
  domReference: React.RefObject<NarrowedElement<ReferenceType> | null>;
  setReference(node: ReferenceType | null): void;
  setFloating(node: HTMLElement | null): void;
  setPositionReference(node: ReferenceType | null): void;
}

export interface ExtendedElements {
  reference: ReferenceType | null;
  floating: HTMLElement | null;
  domReference: NarrowedElement<ReferenceType> | null;
}

export interface PopupEvents {
  emit<T extends string>(event: T, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

/**
 * Reads the interaction state of a popup by key.
 */
export interface PopupInteractionReader {
  (key: 'open'): boolean;
  (key: 'transitionStatus'): TransitionStatus | undefined;
  /**
   * The DOM element the popup is anchored to.
   */
  (key: 'anchorElement'): Element | null;
  /**
   * What the popup is positioned against: an anchor set explicitly, or else the active trigger.
   */
  (key: 'anchor'): ReferenceType | null;
  /**
   * The popup's outermost element: its positioner, or the popup itself when it has none.
   */
  (key: 'popupPositionerElement'): HTMLElement | null;
  /**
   * The popup's id unless its element sets one.
   */
  (key: 'defaultPopupId'): string | undefined;
}

/**
 * Non-reactive values shared by the interaction hooks of one popup.
 */
export interface PopupInteractionContext {
  readonly events: PopupEvents;
  nested: boolean;
  readonly triggerElements: PopupTriggerMap;
  /**
   * The event that opened the popup. Written by `dispatchOpenChange`; NavigationMenu clears it.
   */
  openEvent?: Event | undefined;
  /**
   * The popup's positioning. Written by `useFloating()`.
   */
  positioning?: PopupPositioningContext | undefined;
  /**
   * The popup's list navigation orientation, which nested lists read from their parent. Written by
   * `useListNavigation`.
   */
  orientation?: 'vertical' | 'horizontal' | 'both' | undefined;
  /**
   * Whether the current event passed through the popup's React tree, such as from a portaled
   * child, so native listeners that see it as outside ignore it. Set by `useDismiss` and the focus
   * manager, and cleared on the next tick.
   */
  insideReactTree?: boolean | undefined;
  /**
   * Whether an Escape key press bubbles to the parent popup. Written by `useDismiss` and never
   * cleared.
   */
  escapeKeyBubbles?: boolean | undefined;
  /**
   * Whether an outside press bubbles to the parent popup. Written by `useDismiss` and never
   * cleared.
   */
  outsidePressBubbles?: boolean | undefined;
}

/**
 * The store that interaction hooks, the focus manager and positioning read and write.
 * Popup stores implement it directly. Components without a popup store use `FloatingRootStore`.
 */
export interface PopupInteractionStore {
  select: PopupInteractionReader;
  useState: PopupInteractionReader;
  set(key: 'anchorOverride', value: ReferenceType | null): void;
  set(key: 'anchorElement', value: Element | null): void;
  setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  readonly context: PopupInteractionContext;
}

/**
 * The store anchor positioning reads and clears. Popup stores and `FloatingRootStore` implement it;
 * the narrower handle stores that triggers use don't need to.
 */
export interface PositioningInteractionStore extends PopupInteractionStore {
  /**
   * Forgets the elements positioning reads, so it doesn't run for a `keepMounted` popup whose
   * positioner is unmounted.
   */
  clearPositioning(): void;
}

export type PopupPositioningContext = Omit<
  UsePositionFloatingReturn<ReferenceType>,
  'refs' | 'elements'
> & {
  open: boolean;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  events: PopupEvents;
  nodeId: string | undefined;
  defaultPopupId: string | undefined;
  refs: ExtendedRefs;
  elements: ExtendedElements;
  rootStore: PopupInteractionStore;
};

export interface FloatingNodeType {
  id: string | undefined;
  parentId: string | null;
  context?: PopupPositioningContext | undefined;
}

export type FloatingTreeType = FloatingTreeStore;

export interface ElementProps {
  reference?: React.HTMLProps<Element> | undefined;
  floating?: React.HTMLProps<HTMLElement> | undefined;
  item?: React.HTMLProps<HTMLElement> | undefined;
  trigger?: React.HTMLProps<Element> | undefined;
}

export type ReferenceType = Element | VirtualElement;

export type UseFloatingData = Prettify<UseFloatingReturn>;

export type UseFloatingReturn = Prettify<
  UsePositionFloatingReturn & {
    /**
     * `PopupPositioningContext`
     */
    context: Prettify<PopupPositioningContext>;
    /**
     * Object containing the reference and floating refs and reactive setters.
     */
    refs: ExtendedRefs;
    elements: ExtendedElements;
  }
>;

export interface UseFloatingOptions extends Omit<UsePositionOptions, 'elements'> {
  rootStore?: PopupInteractionStore | undefined;
  /**
   * Object of external elements as an alternative to the `refs` object setters.
   */
  elements?:
    | {
        /**
         * Externally passed reference element. Store in state.
         */
        reference?: ReferenceType | null | undefined;
        /**
         * Externally passed floating element. Store in state.
         */
        floating?: HTMLElement | null | undefined;
      }
    | undefined;
  /**
   * An event callback that is invoked when the floating element is opened or
   * closed.
   */
  onOpenChange?(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  /**
   * Unique node id when using `FloatingTree`.
   */
  nodeId?: string | undefined;
  /**
   * External FloatingTree to use when the one provided by context can't be used.
   */
  externalTree?: FloatingTreeStore | undefined;
}
