'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useAvatarRootContext } from '../root/AvatarRootContext';

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallback.Props>(
  function AvatarFallback(props: AvatarFallback.Props, forwardedRef) {
    const { className, render, delayMs, ...otherProps } = props;

    const context = useAvatarRootContext();
    const [canRender, setCanRender] = React.useState(delayMs === undefined);

    React.useEffect(() => {
      let timerId: number | undefined;

      if (delayMs !== undefined) {
        timerId = window.setTimeout(() => setCanRender(true), delayMs);
      }

      return () => {
        window.clearTimeout(timerId);
      };
    }, [delayMs]);

    const { renderElement } = useComponentRenderer({
      render: render ?? 'span',
      state: context.state,
      className,
      ref: forwardedRef,
      extraProps: otherProps,
    });

    return canRender && context.imageLoadingStatus !== 'loaded' ? renderElement() : null;
  },
);

AvatarFallback.propTypes /* remove-proptypes */ = {
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
   * Time in milliseconds to wait before showing the fallback.
   */
  delayMs: PropTypes.number,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export namespace AvatarFallback {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Time in milliseconds to wait before showing the fallback.
     */
    delayMs?: number;
  }

  export interface State { }
}

export { AvatarFallback };
