'use client';
import { useFloatingTree } from '../../src/utils/popups/tree/FloatingTree';
import type { FloatingTreeStore } from '../../src/utils/popups/tree/FloatingTreeStore';

type FixtureTree = Omit<FloatingTreeStore, 'events'> & {
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
  return useFloatingTree() as FixtureTree | null;
}
