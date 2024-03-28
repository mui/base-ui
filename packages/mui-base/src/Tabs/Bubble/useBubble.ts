import * as React from 'react';
import { TabsListContext } from '../TabsList/TabsListContext';

export function useBubble() {
  const tabsListContext = React.useContext(TabsListContext);
  if (tabsListContext === undefined) {
    throw new Error('Bubble must be used within a TabsList component');
  }

  const { value, tabsListRef, getTabElement } = tabsListContext;

  const [previousLeft, setPreviousLeft] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1 | 0>(0);

  if (value == null || tabsListRef.current == null) {
    return null;
  }

  const selectedTabElement = getTabElement(value);

  if (selectedTabElement == null) {
    return null;
  }

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

  if (left < previousLeft) {
    setDirection(-1);
    setPreviousLeft(left);
  } else if (left > previousLeft) {
    setDirection(1);
    setPreviousLeft(left);
  }

  return {
    left,
    right,
    top,
    bottom,
    direction,
  };
}
