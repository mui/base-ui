'use client';
import * as React from 'react';
import { resolveClassName } from '@mui/base/utils/resolveClassName';
import { useTabBubble } from '../../useTabBubble/useTabBubble';
import { TabBubbleProps } from './TabBubble.types';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useTabBubbleStyleHooks } from '../../useTabBubble/useTabBubbleStyleHooks';

export const TabBubble = React.forwardRef<HTMLSpanElement, TabBubbleProps>(
  function TabBubble(props, forwardedRef) {
    const { className: classNameProp, render: renderProp, ...other } = props;
    const render = renderProp ?? defaultRenderFunctions.span;

    const { direction, getRootProps, orientation, selectedTabPosition } = useTabBubble();
    const ownerState = {
      selectedTabPosition,
      orientation,
      direction,
    };

    const className = resolveClassName(classNameProp, ownerState);
    const styleHooks = useTabBubbleStyleHooks(ownerState);

    const rootProps = {
      ...styleHooks,
      ...other,
      className,
      ref: forwardedRef,
    };

    return render(getRootProps(rootProps), ownerState);
  },
);
