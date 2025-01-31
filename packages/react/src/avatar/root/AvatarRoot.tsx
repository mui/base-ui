'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useAvatarRoot } from './useAvatarRoot';
import { AvatarRootContext } from './AvatarRootContext';

const rootStyleHookMapping = {
  imageLoadingStatus: () => null,
};

/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
const AvatarRoot = React.forwardRef<HTMLSpanElement, AvatarRoot.Props>(function AvatarRoot(
  props: AvatarRoot.Props,
  forwardedRef,
) {
  const { className, render, ...otherProps } = props;

  const { getRootProps, ...avatar } = useAvatarRoot();

  const state: AvatarRoot.State = React.useMemo(
    () => ({
      imageLoadingStatus: avatar.imageLoadingStatus,
    }),
    [avatar.imageLoadingStatus],
  );

  const contextValue = React.useMemo(
    () => ({
      ...avatar,
      state,
    }),
    [avatar, state],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'span',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: rootStyleHookMapping,
  });

  return (
    <AvatarRootContext.Provider value={contextValue}>{renderElement()}</AvatarRootContext.Provider>
  );
});

export namespace AvatarRoot {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State {
    imageLoadingStatus: 'idle' | 'loading' | 'loaded' | 'error';
  }
}

export { AvatarRoot };

AvatarRoot.propTypes /* remove-proptypes */ = {
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
