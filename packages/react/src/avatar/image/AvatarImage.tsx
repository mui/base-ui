'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRoot } from '../root/AvatarRoot';
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
  const {
    className,
    render,
    onLoadingStatusChange: onLoadingStatusChangeProp,
    referrerPolicy,
    ...otherProps
  } = props;

  const context = useAvatarRootContext();
  const imageLoadingStatus = useImageLoadingStatus(props.src, referrerPolicy);

  const handleLoadingStatusChange = useEventCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
    context.setImageLoadingStatus(status);
  });

  useEnhancedEffect(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus);
    }
  }, [imageLoadingStatus, handleLoadingStatusChange]);

  const state: AvatarRoot.State = React.useMemo(
    () => ({
      imageLoadingStatus,
    }),
    [imageLoadingStatus],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'img',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return imageLoadingStatus === 'loaded' ? renderElement() : null;
});

export namespace AvatarImage {
  export interface Props extends BaseUIComponentProps<'img', AvatarRoot.State> {
    /**
     * Callback fired when the loading status changes.
     */
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
  }
}

export { AvatarImage };

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
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange: PropTypes.func,
  /**
   * @ignore
   */
  referrerPolicy: PropTypes.oneOf([
    '',
    'no-referrer-when-downgrade',
    'no-referrer',
    'origin-when-cross-origin',
    'origin',
    'same-origin',
    'strict-origin-when-cross-origin',
    'strict-origin',
    'unsafe-url',
  ]),
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
