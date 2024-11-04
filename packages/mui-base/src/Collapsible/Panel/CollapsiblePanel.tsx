'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleRootContext } from '../Root/CollapsibleRootContext';
import type { CollapsibleRoot } from '../Root/CollapsibleRoot';
import { collapsibleStyleHookMapping } from '../Root/styleHooks';
import { useCollapsiblePanel } from './useCollapsiblePanel';

/**
 *
 * Demos:
 *
 * - [Collapsible](https://base-ui.netlify.app/components/react-collapsible/)
 *
 * API:
 *
 * - [CollapsiblePanel API](https://base-ui.netlify.app/components/react-collapsible/#api-reference-CollapsiblePanel)
 */
const CollapsiblePanel = React.forwardRef(function CollapsiblePanel(
  props: CollapsiblePanel.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, hiddenUntilFound, render, ...otherProps } = props;

  const { animated, mounted, open, panelId, setPanelId, setMounted, setOpen, ownerState } =
    useCollapsibleRootContext();

  const { getRootProps, height, width } = useCollapsiblePanel({
    animated,
    hiddenUntilFound,
    id: panelId,
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
    ownerState,
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

  return renderElement();
});

export { CollapsiblePanel };

namespace CollapsiblePanel {
  export type Props = BaseUIComponentProps<'div', CollapsibleRoot.OwnerState> &
    Pick<useCollapsiblePanel.Parameters, 'hiddenUntilFound'> & {};
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
