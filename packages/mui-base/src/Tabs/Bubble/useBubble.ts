import * as React from 'react';
import { useTabsListContext } from '../TabsList/TabsListContext';
import { useTabsContext } from '../TabsContext';
import { TabSelectionMovementDirection, UseBubbleReturnValue } from './useBubble.types';

export function useBubble(): UseBubbleReturnValue {
  const { tabsListRef, getTabElement } = useTabsListContext();
  const { orientation, direction, value } = useTabsContext();

  // The coordinate of the leading edge of the previously selected tab
  const [previousTabEdge, setPreviousTabEdge] = React.useState(0);
  const [movementDirection, setMovementDirection] =
    React.useState<TabSelectionMovementDirection>(0);

  React.useEffect(() => {
    // Whenever orientation changes, reset the state.
    setMovementDirection(0);
    setPreviousTabEdge(0);
  }, [orientation]);

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;

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

  const selectedTabPosition = React.useMemo(
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
      '--selected-tab-left': `${left}px`,
      '--selected-tab-right': `${right}px`,
      '--selected-tab-top': `${top}px`,
      '--selected-tab-bottom': `${bottom}px`,
      '--selection-forwards': movementDirection === 1 ? '1' : '0',
      '--selection-backwards': movementDirection === -1 ? '1' : '0',
    } as React.CSSProperties;
  }, [left, right, top, bottom, movementDirection, isTabSelected]);

  const getRootProps = React.useCallback(
    (otherProps = {}) => {
      return {
        role: 'presentation',
        style,
        ...otherProps,
      };
    },
    [style],
  );

  return {
    getRootProps,
    selectedTabPosition,
    orientation,
    direction,
  };
}
