'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import { useImageLoadingStatus, ImageLoadingStatus } from './useImageLoadingStatus';

/**
 * The image to be displayed in the avatar.
 * Renders an `<img>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImage.Props>(function AvatarImage(
  props: AvatarImage.Props,
  forwardedRef,
) {
  const { className, render, src, onLoadingStatusChange = () => {}, ...otherProps } = props;

  const context = useAvatarRootContext();
  const imageLoadingStatus = useImageLoadingStatus(src);

  const handleLoadingStatusChange = useEventCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChange(status);
    context.onImageLoadingStatusChange(status);
  });

  useEnhancedEffect(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus);
    }
  }, [imageLoadingStatus, handleLoadingStatusChange]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'img',
    state: context.state,
    className,
    ref: forwardedRef,
    extraProps: {
      ...otherProps,
      src,
    },
  });

  return imageLoadingStatus === 'loaded' ? renderElement() : null;
});

AvatarImage.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  onLoadingStatusChange: PropTypes.func,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  src: PropTypes.string,
} as any;

export namespace AvatarImage {
  export interface Props extends BaseUIComponentProps<'img', State> {
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
  }

  export interface State {}
}

export { AvatarImage };
