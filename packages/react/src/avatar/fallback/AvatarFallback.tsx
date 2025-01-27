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
    const { className, render, delay, ...otherProps } = props;

    const context = useAvatarRootContext();
    const [delayPassed, setDelayPassed] = React.useState(delay === undefined);

    React.useEffect(() => {
      let timerId: number | undefined;

      if (delay !== undefined) {
        timerId = window.setTimeout(() => setDelayPassed(true), delay);
      }

      return () => {
        window.clearTimeout(timerId);
      };
    }, [delay]);

    const { renderElement } = useComponentRenderer({
      render: render ?? 'span',
      state: context.state,
      className,
      ref: forwardedRef,
      extraProps: otherProps,
    });

    const shouldRender = context.imageLoadingStatus !== 'loaded' && delayPassed;

    return shouldRender ? renderElement() : null;
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
   * How long to wait before showing the fallback. Specified in milliseconds.
   */
  delay: PropTypes.number,
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
     * How long to wait before showing the fallback. Specified in milliseconds.
     */
    delay?: number;
  }

  export interface State {}
}

export { AvatarFallback };
