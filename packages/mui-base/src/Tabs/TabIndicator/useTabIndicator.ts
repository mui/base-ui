'use client';
import * as React from 'react';
import { useTabsListContext } from '../TabsList/TabsListContext.js';
import { useTabsRootContext } from '../Root/TabsRootContext.js';
import { mergeReactProps } from '../../utils/mergeReactProps.js';
import { useForcedRerendering } from '../../utils/useForcedRerendering.js';
import type { TabsDirection, TabsOrientation, TabActivationDirection } from '../Root/TabsRoot.js';

function round(value: number) {
  return Math.round(value * 100) * 0.01;
}

export function useTabIndicator(): useTabIndicator.ReturnValue {
  const { tabsListRef, getTabElement } = useTabsListContext();
  const { orientation, direction, value, tabActivationDirection } = useTabsRootContext();

  const rerender = useForcedRerendering();
  React.useEffect(() => {
    if (value != null && tabsListRef.current != null && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        rerender();
      });

      resizeObserver.observe(tabsListRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    return undefined;
  }, [value, tabsListRef, rerender]);

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  let width = 0;
  let height = 0;

  let isTabSelected = false;

  if (value != null && tabsListRef.current != null) {
    const selectedTabElement = getTabElement(value);
    isTabSelected = true;

    if (selectedTabElement != null) {
      const {
        left: tabLeft,
        right: tabRight,
        bottom: tabBottom,
        top: tabTop,
      } = selectedTabElement.getBoundingClientRect();

      const {
        left: listLeft,
        right: listRight,
        top: listTop,
        bottom: listBottom,
      } = tabsListRef.current.getBoundingClientRect();

      left = round(tabLeft - listLeft);
      right = round(listRight - tabRight);
      top = round(tabTop - listTop);
      bottom = round(listBottom - tabBottom);
      width = round(tabRight - tabLeft);
      height = round(tabBottom - tabTop);
    }
  }

  const activeTabPosition = React.useMemo(
    () =>
      isTabSelected
        ? {
            left,
            right,
            top,
            bottom,
          }
        : null,
    [left, right, top, bottom, isTabSelected],
  );

  const style = React.useMemo(() => {
    if (!isTabSelected) {
      return undefined;
    }

    return {
      '--active-tab-left': `${left}px`,
      '--active-tab-right': `${right}px`,
      '--active-tab-top': `${top}px`,
      '--active-tab-bottom': `${bottom}px`,
      '--active-tab-width': `${width}px`,
      '--active-tab-height': `${height}px`,
    } as React.CSSProperties;
  }, [left, right, top, bottom, width, height, isTabSelected]);

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'span'>(externalProps, {
        role: 'presentation',
        style,
      });
    },
    [style],
  );

  return {
    getRootProps,
    activeTabPosition,
    orientation,
    direction,
    tabActivationDirection,
  };
}

export interface ActiveTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export namespace useTabIndicator {
  export interface ReturnValue {
    getRootProps: (
      otherProps?: React.ComponentPropsWithRef<'span'>,
    ) => React.ComponentPropsWithRef<'span'>;
    activeTabPosition: ActiveTabPosition | null;
    direction: TabsDirection;
    orientation: TabsOrientation;
    tabActivationDirection: TabActivationDirection;
  }
}
