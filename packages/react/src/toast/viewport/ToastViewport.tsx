'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { ToastViewportContext } from './ToastViewportContext';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';
import { FocusGuard } from './FocusGuard';
import { useToastViewport } from './useToastViewport';
import { useToastContext } from '../provider/ToastProviderContext';

/**
 * A container viewport for toasts.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastViewport = React.forwardRef(function ToastViewport(
  props: ToastViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...other } = props;

  const { hovering, focused, hasDifferingHeights } = useToastContext();

  const viewport = useToastViewport();

  const mergedRef = useForkRef(viewport.viewportRef, forwardedRef);

  const state: ToastViewport.State = React.useMemo(
    () => ({
      expanded: hovering || focused || hasDifferingHeights,
    }),
    [hovering, focused, hasDifferingHeights],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    propGetter: viewport.getViewportProps,
    extraProps: {
      ...other,
      children: (
        <React.Fragment>
          {viewport.numToasts > 0 && viewport.prevFocusElement && (
            <FocusGuard onFocus={viewport.handleFocusGuard} />
          )}
          {children}
          {viewport.numToasts > 0 && viewport.prevFocusElement && (
            <FocusGuard onFocus={viewport.handleFocusGuard} />
          )}
        </React.Fragment>
      ),
    },
  });

  return (
    <ToastViewportContext.Provider value={viewport.contextValue}>
      <FloatingPortalLite>
        {viewport.numToasts > 0 && viewport.prevFocusElement && (
          <FocusGuard onFocus={viewport.handleFocusGuard} />
        )}
        {renderElement()}
      </FloatingPortalLite>
    </ToastViewportContext.Provider>
  );
});

namespace ToastViewport {
  export interface State {
    /**
     * Whether toasts are expanded in the viewport.
     */
    expanded: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

ToastViewport.propTypes /* remove-proptypes */ = {
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ToastViewport };
