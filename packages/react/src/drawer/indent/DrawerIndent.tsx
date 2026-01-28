'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';
import { DrawerBackdropCssVars } from '../backdrop/DrawerBackdropCssVars';
import { DrawerPopupCssVars } from '../popup/DrawerPopupCssVars';

const stateAttributesMapping: StateAttributesMapping<DrawerIndent.State> = {
  active(value): Record<string, string> | null {
    if (value) {
      return { 'data-active': '' };
    }
    return { 'data-inactive': '' };
  },
};

/**
 * A wrapper element intended to contain your app's main UI.
 * Applies `data-active` when any drawer within the nearest <Drawer.Provider> is open.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerIndent = React.forwardRef(function DrawerIndent(
  componentProps: DrawerIndent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const providerContext = useDrawerProviderContext(true);

  const active = providerContext?.active ?? false;
  const swipeProgressStore = providerContext?.swipeProgressStore;
  const frontmostHeightStore = providerContext?.frontmostHeightStore;

  const indentRef = React.useRef<HTMLDivElement | null>(null);

  useIsoLayoutEffect(() => {
    const element = indentRef.current;
    if (!element || !swipeProgressStore) {
      return undefined;
    }

    const syncSwipeProgress = () => {
      const progress = swipeProgressStore.getSnapshot();
      if (progress <= 0) {
        element.style.removeProperty(DrawerBackdropCssVars.swipeProgress);
        return;
      }

      element.style.setProperty(DrawerBackdropCssVars.swipeProgress, `${progress}`);
    };

    syncSwipeProgress();

    const unsubscribe = swipeProgressStore.subscribe(syncSwipeProgress);
    return () => {
      unsubscribe();
      element.style.removeProperty(DrawerBackdropCssVars.swipeProgress);
    };
  }, [swipeProgressStore]);

  useIsoLayoutEffect(() => {
    const element = indentRef.current;
    if (!element || !frontmostHeightStore) {
      return undefined;
    }

    const syncFrontmostHeight = () => {
      const height = frontmostHeightStore.getSnapshot();
      if (height <= 0) {
        element.style.removeProperty(DrawerPopupCssVars.height);
      } else {
        element.style.setProperty(DrawerPopupCssVars.height, `${height}px`);
      }
    };

    syncFrontmostHeight();

    const unsubscribe = frontmostHeightStore.subscribe(syncFrontmostHeight);
    return () => {
      unsubscribe();
      element.style.removeProperty(DrawerPopupCssVars.height);
    };
  }, [frontmostHeightStore]);

  const state: DrawerIndent.State = React.useMemo(
    () => ({
      active,
    }),
    [active],
  );

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, indentRef],
    state,
    props: elementProps,
    stateAttributesMapping,
  });
});

export interface DrawerIndentState {
  /**
   * Whether any drawer within the nearest <Drawer.Provider> is open.
   */
  active: boolean;
}

export interface DrawerIndentProps extends BaseUIComponentProps<'div', DrawerIndent.State> {}

export namespace DrawerIndent {
  export type State = DrawerIndentState;
  export type Props = DrawerIndentProps;
}
