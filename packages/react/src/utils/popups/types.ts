import type {
  Placement,
  UseFloatingOptions as UsePositionOptions,
  UseFloatingReturn as UsePositionFloatingReturn,
  VirtualElement,
} from '@floating-ui/react-dom';
import type * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { FloatingUIOpenChangeDetails } from '../../internals/types';
import type { REASONS } from '../../internals/reasons';

import type { PopupTreeStore } from './tree/PopupTreeStore';
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
 * An event emitter whose events and payloads are listed in `EventMap`.
 */
export interface FloatingEventEmitter<EventMap extends object> {
  emit<Name extends keyof EventMap & string>(event: Name, data: EventMap[Name]): void;
  on<Name extends keyof EventMap & string>(
    event: Name,
    handler: (data: EventMap[Name]) => void,
  ): void;
  off<Name extends keyof EventMap & string>(
    event: Name,
    handler: (data: EventMap[Name]) => void,
  ): void;
}

/**
 * The events of one popup's interaction hooks.
 */
export interface FloatingEventMap {
  /**
   * An accepted open change, emitted by `dispatchOpenChange`.
   */
  openchange: FloatingUIOpenChangeDetails;
}

export type PopupEvents = FloatingEventEmitter<FloatingEventMap>;

/**
 * Why a menu opened or closed, as reported by `menuopenchange`. The same reasons as
 * `Menu.Root`'s `onOpenChange` (`MenuRoot.spec.tsx` checks that they match).
 */
export type MenuOpenChangeReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.closePress
  | typeof REASONS.siblingOpen
  | typeof REASONS.cancelOpen
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

/**
 * The payload of `menuopenchange`.
 */
export interface MenuOpenEventDetails {
  open: boolean;
  reason: MenuOpenChangeReason | null;
  nodeId: string | undefined;
  parentNodeId: string | null;
}

/**
 * The events shared by the popups of one popup tree.
 */
export interface FloatingTreeEventMap {
  /**
   * A hover-opened popup closed after the pointer left it.
   */
  'floating.closed': MouseEvent;
  /**
   * A menu opened or closed.
   */
  menuopenchange: MenuOpenEventDetails;
  /**
   * A menu item was hovered, so sibling submenus of other items can close.
   */
  itemhover: { nodeId: string | undefined; target: Element | null };
  /**
   * A menu item was pressed, or a press that opened a menu was cancelled, so the open menus close.
   */
  close: {
    domEvent: Event | undefined;
    reason: typeof REASONS.itemPress | typeof REASONS.cancelOpen;
  };
}

export type FloatingTreeEvents = FloatingEventEmitter<FloatingTreeEventMap>;

/**
 * What `useFloating()` publishes about a positioned popup for the interaction hooks: its placement
 * and elements, and the id of its node in the popup tree. Written in a layout effect after every
 * render.
 */
export interface FloatingPositioningData {
  placement: Placement;
  elements: ExtendedElements;
  nodeId: string | undefined;
  refs: { floating: React.RefObject<HTMLElement | null> };
}

/**
 * Values one popup's interaction hooks share with each other, and with other popups in the same
 * popup tree, without re-rendering.
 */
export interface ContextData {
  /**
   * The event that opened the popup. Written by `dispatchOpenChange`; NavigationMenu clears it.
   */
  openEvent?: Event | undefined;
  /**
   * Whether the current press or focus started inside the popup's React tree. Written by
   * `useDismiss` and `PopupFocusManager`.
   */
  insideReactTree?: boolean | undefined;
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
   * Whether an Escape key press bubbles to the parent popup. Written by `useDismiss` and never
   * cleared.
   */
  __escapeKeyBubbles?: boolean | undefined;
  /**
   * Whether an outside press bubbles to the parent popup. Written by `useDismiss` and never
   * cleared.
   */
  __outsidePressBubbles?: boolean | undefined;
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
   * The last trigger the popup belonged to, kept after it closes so focus can return to it.
   */
  (key: 'lastTriggerElement'): Element | null;
  /**
   * What the popup is positioned against: an anchor set explicitly, or else the active trigger.
   */
  (key: 'anchor'): ReferenceType | null;
  /**
   * The popup's outermost element: its positioner, or the popup itself when it has none.
   */
  (key: 'outerPopupElement'): HTMLElement | null;
  /**
   * The popup's id unless its element sets one.
   */
  (key: 'defaultPopupId'): string | undefined;
}

/**
 * Non-reactive values shared by the interaction hooks of one popup.
 */
export interface PopupInteractionContext {
  readonly dataRef: React.RefObject<ContextData>;
  readonly events: PopupEvents;
  nested: boolean;
  readonly triggerElements: PopupTriggerMap;
}

/**
 * The store that interaction hooks, the focus manager and positioning read and write.
 * Popup stores implement it directly. Components without a popup store use `StandaloneInteractionStore`.
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
 * The store anchor positioning reads and clears. Popup stores and `StandaloneInteractionStore` implement it;
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
  dataRef: React.RefObject<ContextData>;
  nodeId: string | undefined;
  defaultPopupId: string | undefined;
  refs: ExtendedRefs;
  elements: ExtendedElements;
  rootStore: PopupInteractionStore;
};

export interface PopupTreeNodeType {
  id: string | undefined;
  parentId: string | null;
  context?: PopupPositioningContext | undefined;
}

export type PopupTreeType = PopupTreeStore;

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
  rootContext?: PopupInteractionStore | undefined;
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
   * Unique node id when using `PopupTree`.
   */
  nodeId?: string | undefined;
  /**
   * External PopupTree to use when the one provided by context can't be used.
   */
  externalTree?: PopupTreeStore | undefined;
}
