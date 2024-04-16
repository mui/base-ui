'use client';
import * as React from 'react';
import { TabProps, TabOwnerState } from './Tab.types';
import { useTab } from '../../useTab';
import { useTabStyleHooks } from './useTabStyleHooks';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/)
 *
 * API:
 *
 * - [Tab API](https://mui.com/base-ui/react-tabs/components-api/#tab)
 */
const Tab = React.forwardRef(function Tab(
  props: TabProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    className: classNameProp,
    disabled = false,
    onChange,
    render: renderProp,
    value,
    ...other
  } = props;

  const render = renderProp ?? defaultRenderFunctions.button;

  const { selected, getRootProps, rootRef, orientation } = useTab({
    ...props,
    rootRef: forwardedRef,
  });

  const ownerState: TabOwnerState = {
    disabled,
    selected,
    orientation,
  };

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useTabStyleHooks(ownerState);
  const mergedRef = useRenderPropForkRef(render, rootRef);

  const rootProps = getRootProps({
    ...styleHooks,
    ...other,
    className,
    ref: mergedRef,
  });

  return evaluateRenderProp(render, rootProps, ownerState);
});

export { Tab };
