'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRoot } from '../root/AvatarRoot';
import { avatarStyleHookMapping } from '../root/styleHooks';

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallback.Props>(
  function AvatarFallback(props: AvatarFallback.Props, forwardedRef) {
    const { className, render, delay, ...otherProps } = props;

    const { imageLoadingStatus } = useAvatarRootContext();
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

    const state: AvatarRoot.State = React.useMemo(
      () => ({
        imageLoadingStatus,
      }),
      [imageLoadingStatus],
    );

    const { renderElement } = useComponentRenderer({
      render: render ?? 'span',
      state,
      className,
      ref: forwardedRef,
      extraProps: otherProps,
      customStyleHookMapping: avatarStyleHookMapping,
    });

    const shouldRender = imageLoadingStatus !== 'loaded' && delayPassed;

    return shouldRender ? renderElement() : null;
  },
);

export namespace AvatarFallback {
  export interface Props extends BaseUIComponentProps<'span', AvatarRoot.State> {
    /**
     * How long to wait before showing the fallback. Specified in milliseconds.
     */
    delay?: number;
  }
}
