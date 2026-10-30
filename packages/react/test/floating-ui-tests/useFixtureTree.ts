'use client';
import { usePopupTree } from '../../src/utils/popups/tree/PopupTree';
import type { PopupTreeStore } from '../../src/utils/popups/tree/PopupTreeStore';

type FixtureTree = Omit<PopupTreeStore, 'events'> & {
  events: {
    emit(event: string, data?: any): void;
    on(event: string, handler: (data: any) => void): void;
    off(event: string, handler: (data: any) => void): void;
  };
};

/**
 * The popup tree as the Menu fixtures see it: their menus talk through their own, untyped tree
 * events.
 */
export function useFixtureTree() {
  return usePopupTree() as FixtureTree | null;
}
