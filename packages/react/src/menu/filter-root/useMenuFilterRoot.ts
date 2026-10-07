'use client';
import * as React from 'react';
import type { MenuFilterRootProps } from './MenuFilterRoot';

/** Splits a filterable root's props between the menu root and the filter below it. */
export function useMenuFilterRoot<Payload>(props: MenuFilterRootProps<Payload>) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    filter,
    autoHighlight = false,
    locale,
    ...otherProps
  } = props;

  const virtualFocusRef = React.useRef<HTMLElement | null>(null);

  return {
    children,
    rootProps: {
      ...otherProps,
      virtualFocus: true,
      virtualFocusRef,
      allowEscape: !autoHighlight,
      resetOnPointerLeave: autoHighlight !== 'always',
    },
    dropdownProps: {
      value,
      defaultValue,
      onValueChange,
      filter,
      autoHighlight,
      locale,
    },
  };
}
