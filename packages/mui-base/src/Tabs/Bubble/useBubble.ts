import * as React from 'react';
import { useTabsListContext } from '../TabsList/TabsListContext';
import { useTabsContext } from '../TabsContext';

export function useBubble() {
  const { tabsListRef, getTabElement } = useTabsListContext();
  const { orientation, value } = useTabsContext();

  // The coordinate of the leading edge of the previously selected tab
  const [previousTabEdge, setPreviousTabEdge] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1 | 0>(0);

  React.useEffect(() => {
    // Whenever orientation changes, reset the state.
    setDirection(0);
    setPreviousTabEdge(0);
  }, [orientation]);

  if (value == null || tabsListRef.current == null) {
    return null;
  }

  const selectedTabElement = getTabElement(value);

  if (selectedTabElement == null) {
    return null;
  }

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

  const left = tabLeft - listLeft;
  const right = listRight - tabRight;
  const top = tabTop - listTop;
  const bottom = listBottom - tabBottom;

  if (orientation === 'horizontal') {
    if (left < previousTabEdge) {
      setDirection(-1);
      setPreviousTabEdge(left);
    } else if (left > previousTabEdge) {
      setDirection(1);
      setPreviousTabEdge(left);
    }
  } else if (top < previousTabEdge) {
    setDirection(-1);
    setPreviousTabEdge(top);
  } else if (top > previousTabEdge) {
    setDirection(1);
    setPreviousTabEdge(top);
  }

  return {
    left,
    right,
    top,
    bottom,
    movementDirection: direction,
    orientation,
  };
}
