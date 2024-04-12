'use client';
import * as React from 'react';
import { useTabsListContext } from '../Tabs/TabsList/TabsListContext';
import { useTabsContext } from '../Tabs/TabsContext';
import { TabSelectionMovementDirection, UseTabIndicatorReturnValue } from './useTabIndicator.types';
import { mergeReactProps } from '../utils/mergeReactProps';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/#hooks)
 *
 * API:
 *
 * - [useTabIndicator API](https://mui.com/base-ui/react-tabs/hooks-api/#use-tab-indicator)
 */
export function useTabIndicator(): UseTabIndicatorReturnValue {
  const { tabsListRef, getTabElement } = useTabsListContext();
  const { orientation, direction, value } = useTabsContext();
  const [, forceUpdate] = React.useState({});

  // The coordinate of the leading edge of the previously active tab
  const [previousTabEdge, setPreviousTabEdge] = React.useState(0);
  const [movementDirection, setMovementDirection] =
    React.useState<TabSelectionMovementDirection>(0);

  React.useEffect(() => {
    if (value != null && tabsListRef.current != null && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        forceUpdate({});
      });

      resizeObserver.observe(tabsListRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    return undefined;
  }, [value, tabsListRef]);

  React.useEffect(() => {
    // Whenever orientation changes, reset the state.
    setMovementDirection(0);
    setPreviousTabEdge(0);
  }, [orientation]);

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
      // TODO: resize observer on TabsList

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

      left = tabLeft - listLeft;
      right = listRight - tabRight;
      top = tabTop - listTop;
      bottom = listBottom - tabBottom;
      width = tabRight - tabLeft;
      height = tabBottom - tabTop;

      if (orientation === 'horizontal') {
        if (left < previousTabEdge) {
          setMovementDirection(-1);
          setPreviousTabEdge(left);
        } else if (left > previousTabEdge) {
          setMovementDirection(1);
          setPreviousTabEdge(left);
        }
      } else if (top < previousTabEdge) {
        setMovementDirection(-1);
        setPreviousTabEdge(top);
      } else if (top > previousTabEdge) {
        setMovementDirection(1);
        setPreviousTabEdge(top);
      }
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
            movementDirection,
          }
        : null,
    [left, right, top, bottom, movementDirection, isTabSelected],
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
      '--active-tab-movement-forwards': movementDirection === 1 ? '1' : '0',
      '--active-tab-movement-backwards': movementDirection === -1 ? '1' : '0',
    } as React.CSSProperties;
  }, [left, right, top, bottom, width, height, movementDirection, isTabSelected]);

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
  };
}
