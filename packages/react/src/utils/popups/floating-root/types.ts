import type {
  Placement,
  UseFloatingOptions as UsePositionOptions,
  UseFloatingReturn as UsePositionFloatingReturn,
  VirtualElement,
} from '@floating-ui/react-dom';
import type * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import type { FloatingUIOpenChangeDetails } from '../../../internals/types';
import type { REASONS } from '../../../internals/reasons';

import type { FloatingTreeStore } from '../tree/FloatingTreeStore';
import type { TransitionStatus } from '../../../internals/useTransitionStatus';
import type { PopupTriggerMap } from '../popupTriggerMap';

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

export type FloatingEvents = FloatingEventEmitter<FloatingEventMap>;

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
   * `useDismiss` and `FloatingFocusManager`.
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
export interface FloatingRootContextReader {
  (key: 'open'): boolean;
  (key: 'transitionStatus'): TransitionStatus | undefined;
  (key: 'domReferenceElement'): Element | null;
  (key: 'lastTriggerElement'): Element | null;
  (key: 'referenceElement'): ReferenceType | null;
  (key: 'floatingElement'): HTMLElement | null;
  (key: 'floatingId'): string | undefined;
}

/**
 * Non-reactive values shared by the interaction hooks of one popup.
 */
export interface FloatingRootContextValues {
  readonly dataRef: React.RefObject<ContextData>;
  readonly events: FloatingEvents;
  nested: boolean;
  readonly triggerElements: PopupTriggerMap;
}

/**
 * The store that interaction hooks, the focus manager and positioning read and write.
 * Popup stores implement it directly. Components without a popup store use `FloatingRootStore`.
 */
export interface FloatingRootContext {
  select: FloatingRootContextReader;
  useState: FloatingRootContextReader;
  set(key: 'positionReference', value: ReferenceType | null): void;
  set(key: 'domReferenceElement', value: Element | null): void;
  setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  readonly context: FloatingRootContextValues;
}

export type FloatingContext = Omit<
  UsePositionFloatingReturn<ReferenceType>,
  'refs' | 'elements'
> & {
  open: boolean;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  events: FloatingEvents;
  dataRef: React.RefObject<ContextData>;
  nodeId: string | undefined;
  floatingId: string | undefined;
  refs: ExtendedRefs;
  elements: ExtendedElements;
  rootStore: FloatingRootContext;
};

/**
 * What a popup tree member publishes about itself for the other members: whether it is open, its
 * elements, and its interaction hooks' shared data. It is a snapshot taken in a layout effect after
 * the member renders, not live state, so a node the member no longer updates keeps its last
 * snapshot.
 */
export interface FloatingNodeSnapshot {
  open: boolean;
  elements: Pick<ExtendedElements, 'floating' | 'domReference'>;
  dataRef: React.RefObject<ContextData>;
}

export interface FloatingNodeType {
  id: string | undefined;
  parentId: string | null;
  context?: FloatingNodeSnapshot | undefined;
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
     * `FloatingContext`
     */
    context: Prettify<FloatingContext>;
    /**
     * Object containing the reference and floating refs and reactive setters.
     */
    refs: ExtendedRefs;
    elements: ExtendedElements;
  }
>;

export interface UseFloatingOptions extends Omit<UsePositionOptions, 'elements'> {
  rootContext?: FloatingRootContext | undefined;
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
