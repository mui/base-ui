'use client';
import * as React from 'react';
import { useTabIndicator } from '../../useTabIndicator/useTabIndicator';
import { TabIndicatorProps } from './TabIndicator.types';
import { resolveClassName } from '../../utils/resolveClassName';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useTabIndicatorStyleHooks } from './useTabIndicatorStyleHooks';

export const TabIndicator = React.forwardRef<HTMLSpanElement, TabIndicatorProps>(
  function TabIndicator(props, forwardedRef) {
    const { className: classNameProp, render: renderProp, ...other } = props;
    const render = renderProp ?? defaultRenderFunctions.span;

    const {
      direction,
      getRootProps,
      orientation,
      activeTabPosition: selectedTabPosition,
    } = useTabIndicator();
    const ownerState = {
      selectedTabPosition,
      orientation,
      direction,
    };

    const className = resolveClassName(classNameProp, ownerState);
    const styleHooks = useTabIndicatorStyleHooks(ownerState);

    const rootProps = {
      ...styleHooks,
      ...other,
      className,
      ref: forwardedRef,
    };

    return render(getRootProps(rootProps), ownerState);
  },
);
