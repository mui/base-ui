import type {
  Placement,
  UseFloatingOptions as UsePositionOptions,
  UseFloatingReturn as UsePositionFloatingReturn,
  VirtualElement,
} from '@floating-ui/react-dom';
import type * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { FloatingUIOpenChangeDetails } from '../../internals/types';

import type { PopupTreeRegistry } from './tree/PopupTreeRegistry';
import type { EventEmitter } from './createEventEmitter';
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

/**
 * The events of one popup's interaction hooks.
 */
export interface PopupEventMap {
  /**
   * An accepted open change, emitted by `dispatchOpenChange`.
   */
  openChange: FloatingUIOpenChangeDetails;
  /**
   * A close request dropped because the popup was already closed, emitted by the popup store so a
   * pending hover open is cancelled.
   */
  droppedClose: undefined;
}

export type PopupEvents = EventEmitter<PopupEventMap>;

/**
 * What `useFloating()` publishes about a positioned popup for the interaction hooks: its placement
 * and elements. Written in a layout effect after every render.
 */
export interface FloatingPositioningData {
  placement: Placement;
  elements: ExtendedElements;
  refs: { floating: React.RefObject<HTMLElement | null> };
}

/**
 * Reads the interaction state of a popup by key.
 */
export interface PopupInteractionReader {
  (key: 'open'): boolean;
  (key: 'transitionStatus'): TransitionStatus | undefined;
  /**
   * The active trigger's element. Popup stores keep it after the popup unmounts;
   * `FloatingRootStore` clears it while the popup isn't mounted.
   */
  (key: 'anchorElement'): Element | null;
  /**
   * The anchor the interaction hooks see: the anchor override, such as the cursor position from
   * `useClientPoint`, or else the owner's anchor (usually the active trigger). A Positioner's
   * `anchor` prop isn't included; positioning applies it on its own.
   */
  (key: 'anchor'): ReferenceType | null;
  /**
   * The popup's positioner element, or the popup itself when it has no positioner.
   */
  (key: 'positionerElement'): HTMLElement | null;
  /**
   * The popup's id unless its element sets one.
   */
  (key: 'defaultPopupId'): string | undefined;
  /**
   * The popup tree the popup belongs to or reads, if any.
   */
  (key: 'popupTree'): PopupTreeRegistry | null;
  /**
   * The id of the popup's own node in its popup tree. Only tree members have one.
   */
  (key: 'popupNodeId'): string | undefined;
  /**
   * The id of the node the popup is nested in, if any.
   */
  (key: 'popupParentNodeId'): string | null;
}

/**
 * Non-reactive values shared by the interaction hooks of one popup.
 * The inert stores that detached triggers use before a Root attaches freeze their context, so
 * code that can run against them only reads these fields.
 */
export interface PopupInteractionContext {
  readonly events: PopupEvents;
  readonly triggerElements: PopupTriggerMap;
  /**
   * The event that opened the popup. Written by `dispatchOpenChange`; NavigationMenu clears it.
   */
  openEvent?: Event | undefined;
  /**
   * The popup's positioning. Written by `useFloating()`.
   */
  positioning?: FloatingPositioningData | undefined;
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
 * Popup stores implement it directly. Navigation Menu and Toast, which keep their open state
 * outside a store, use `FloatingRootStore`.
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
   * Forgets the elements positioning reads while the popup isn't mounted, so positioning doesn't
   * run for a `keepMounted` popup that is closed.
   */
  clearPositioning(): void;
}

export type PopupPositioningContext = Omit<
  UsePositionFloatingReturn<ReferenceType>,
  'refs' | 'elements'
> & {
  open: boolean;
  defaultPopupId: string | undefined;
  refs: ExtendedRefs;
  elements: ExtendedElements;
  rootStore: PopupInteractionStore;
};

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
}
