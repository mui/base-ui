'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { ToolbarRootContext } from './ToolbarRootContext';
import { useToolbarRoot } from './useToolbarRoot';

/**
 * A container for grouping a set of controls, such as buttons, toggle groups, or menus.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarRoot = React.forwardRef(function ToolbarRoot(
  props: ToolbarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    cols = 1,
    disabled = false,
    loop = true,
    orientation = 'horizontal',
    className,
    render,
    ...otherProps
  } = props;

  const { getRootProps, disabledIndices, setItemMap } = useToolbarRoot({
    disabled,
    orientation,
  });

  const toolbarRootContext = React.useMemo(
    () => ({
      disabled,
      orientation,
      setItemMap,
    }),
    [disabled, orientation, setItemMap],
  );

  const state = React.useMemo(() => ({ disabled, orientation }), [disabled, orientation]);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    state,
    extraProps: otherProps,
    ref: forwardedRef,
  });

  return (
    <ToolbarRootContext.Provider value={toolbarRootContext}>
      <CompositeRoot
        cols={cols}
        disabledIndices={disabledIndices}
        loop={loop}
        onMapChange={setItemMap}
        render={renderElement()}
      />
    </ToolbarRootContext.Provider>
  );
});

export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarItemMetadata {
  focusableWhenDisabled: boolean;
}

namespace ToolbarRoot {
  export type State = {
    disabled: boolean;
    orientation: ToolbarOrientation;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The number of columns. When greater than 1, the toolbar is arranged into
     * a grid.
     * @default 1
     */
    cols?: number;
    disabled?: boolean;
    /**
     * The orientation of the toolbar.
     * @default 'horizontal'
     */
    orientation?: ToolbarOrientation;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
     *
     * @default true
     */
    loop?: boolean;
  }
}

export { ToolbarRoot };

ToolbarRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The number of columns. When greater than 1, the toolbar is arranged into
   * a grid.
   * @default 1
   */
  cols: PropTypes.number,
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
   *
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * The orientation of the toolbar.
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
