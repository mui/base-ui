'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
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

Tab.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * Callback invoked when new value is being set.
   */
  onChange: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * You can provide your own value. Otherwise, it falls back to the child position index.
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
} as any;

export { Tab };
