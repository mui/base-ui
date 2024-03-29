'use client';
import * as React from 'react';
import { resolveClassName } from '@mui/base/utils/resolveClassName';
import { useBubble } from './useBubble';
import { TabsBubbleProps } from './Bubble.types';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useBubbleStyleHooks } from './useBubbleStyleHooks';

export const TabsBubble = React.forwardRef<HTMLSpanElement, TabsBubbleProps>(
  function TabsBubble(props, forwardedRef) {
    const { className: classNameProp, render: renderProp, ...other } = props;
    const render = renderProp ?? defaultRenderFunctions.span;

    const { direction, getRootProps, orientation, selectedTabPosition } = useBubble();
    const ownerState = {
      selectedTabPosition,
      orientation,
      direction,
    };

    const className = resolveClassName(classNameProp, ownerState);
    const styleHooks = useBubbleStyleHooks(ownerState);

    const rootProps = {
      ...styleHooks,
      ...other,
      className,
      ref: forwardedRef,
    };

    return render(getRootProps(rootProps), ownerState);
  },
);
