'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  componentProps: ToolbarRoot.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    render,
    cols = 1,
    disabled = false,
    loop = true,
    orientation = 'horizontal',
    ...intrinsicProps
  } = componentProps;

  const { disabledIndices, setItemMap } = useToolbarRoot();

  const toolbarRootContext: ToolbarRootContext = React.useMemo(
    () => ({
      disabled,
      orientation,
      setItemMap,
    }),
    [disabled, orientation, setItemMap],
  );

  const state = React.useMemo(() => ({ disabled, orientation }), [disabled, orientation]);

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref,
    props: [
      {
        'aria-orientation': orientation,
        role: 'toolbar',
      },
      intrinsicProps,
    ],
  });

  return (
    <ToolbarRootContext.Provider value={toolbarRootContext}>
      <CompositeRoot
        cols={cols}
        disabledIndices={disabledIndices}
        loop={loop}
        onMapChange={setItemMap}
        orientation={orientation}
        render={renderElement()}
      />
    </ToolbarRootContext.Provider>
  );
});

export interface ToolbarItemMetadata {
  focusableWhenDisabled: boolean;
}

namespace ToolbarRoot {
  export type State = {
    disabled: boolean;
    orientation: Orientation;
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
    orientation?: Orientation;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
     *
     * @default true
     */
    loop?: boolean;
  }
}

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

export { ToolbarRoot };
