'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import type { CollapsibleRoot } from '../root/CollapsibleRoot';
import { collapsibleStyleHookMapping } from '../root/styleHooks';
import { useCollapsiblePanel } from './useCollapsiblePanel';

/**
 *
 * Demos:
 *
 * - [Collapsible](https://base-ui.com/components/react-collapsible/)
 *
 * API:
 *
 * - [CollapsiblePanel API](https://base-ui.com/components/react-collapsible/#api-reference-CollapsiblePanel)
 */
const CollapsiblePanel = React.forwardRef(function CollapsiblePanel(
  props: CollapsiblePanel.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, hiddenUntilFound, keepMounted = false, render, ...otherProps } = props;

  const { animated, mounted, open, panelId, setPanelId, setMounted, setOpen, state } =
    useCollapsibleRootContext();

  const { getRootProps, height, width, isOpen } = useCollapsiblePanel({
    animated,
    hiddenUntilFound,
    id: panelId,
    keepMounted,
    mounted,
    open,
    ref: forwardedRef,
    setPanelId,
    setMounted,
    setOpen,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state,
    className,
    extraProps: {
      ...otherProps,
      style: {
        ...otherProps.style,
        '--collapsible-panel-height': height ? `${height}px` : undefined,
        '--collapsible-panel-width': width ? `${width}px` : undefined,
      },
    },
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  if (!keepMounted && !isOpen) {
    return null;
  }

  return renderElement();
});

export { CollapsiblePanel };

namespace CollapsiblePanel {
  export interface Props
    extends BaseUIComponentProps<'div', CollapsibleRoot.State>,
      Pick<useCollapsiblePanel.Parameters, 'hiddenUntilFound'> {
    /**
     * If `true`, the panel remains mounted when closed and is instead
     * hidden using the `hidden` attribute
     * If `false`, the panel is unmounted when closed.
     * @default false
     */
    keepMounted?: boolean;
  }
}

CollapsiblePanel.propTypes /* remove-proptypes */ = {
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
   * If `true`, sets `hidden="until-found"` when closed.
   * If `false`, sets `hidden` when closed.
   * @default false
   */
  hiddenUntilFound: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;
