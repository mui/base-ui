import type {
  UseFloatingOptions as UsePositionOptions,
  UseFloatingReturn as UsePositionFloatingReturn,
  VirtualElement,
} from '@floating-ui/react-dom';
import type * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';

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

export interface FloatingEvents {
  emit<T extends string>(event: T, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

export interface ContextData {
  openEvent?: Event | undefined;
  floatingContext?: FloatingContext | undefined;
  [key: string]: any;
}

/**
 * Reads the interaction state of a popup by key.
 */
export interface FloatingRootContextReader {
  (key: 'open'): boolean;
  (key: 'transitionStatus'): TransitionStatus | undefined;
  (key: 'domReferenceElement'): Element | null;
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

export interface FloatingNodeType {
  id: string | undefined;
  parentId: string | null;
  context?: FloatingContext | undefined;
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
