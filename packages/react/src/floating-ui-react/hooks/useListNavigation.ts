'use client';
import { getGridNavigatedIndex } from '../utils/composite';
import type { ElementProps, FloatingContext, FloatingRootContext } from '../types';
import { useListNavigationCore, type UseListNavigationProps } from './useListNavigationCore';

export type { UseListNavigationProps } from './useListNavigationCore';

/**
 * Adds arrow key-based navigation of a list of items, either using real DOM
 * focus or virtual focus.
 * @see https://floating-ui.com/docs/useListNavigation
 */
export function useListNavigation(
  context: FloatingRootContext | FloatingContext,
  props: UseListNavigationProps,
): ElementProps {
  return useListNavigationCore(context, props, getGridNavigatedIndex);
}

export function useListNavigationNoGrid(
  context: FloatingRootContext | FloatingContext,
  props: UseListNavigationProps,
): ElementProps {
  return useListNavigationCore(context, props);
}
