'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CompositeList } from '../List/CompositeList';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext } from './CompositeRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Dimensions } from '../composite';

/**
 * @ignore - internal component.
 */
const CompositeRoot = React.forwardRef(function CompositeRoot(
  props: CompositeRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    activeIndex: activeIndexProp,
    onActiveIndexChange: onActiveIndexChangeProp,
    orientation,
    dense,
    itemSizes,
    loop,
    cols,
    ...otherProps
  } = props;

  const { getRootProps, activeIndex, onActiveIndexChange, elementsRef } = useCompositeRoot(props);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    ref: forwardedRef,
    render: render ?? 'div',
    ownerState: {},
    className,
    extraProps: otherProps,
  });

  const contextValue: CompositeRootContext = React.useMemo(
    () => ({ activeIndex, onActiveIndexChange }),
    [activeIndex, onActiveIndexChange],
  );

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={elementsRef}>{renderElement()}</CompositeList>
    </CompositeRootContext.Provider>
  );
});

namespace CompositeRoot {
  export interface OwnerState {}

  export type Props = BaseUIComponentProps<'div', OwnerState> & {
    orientation?: 'horizontal' | 'vertical' | 'both';
    cols?: number;
    loop?: boolean;
    activeIndex?: number;
    onActiveIndexChange?: (index: number) => void;
    itemSizes?: Dimensions[];
    dense?: boolean;
  };
}

CompositeRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  activeIndex: PropTypes.number,
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  cols: PropTypes.number,
  /**
   * @ignore
   */
  dense: PropTypes.bool,
  /**
   * @ignore
   */
  itemSizes: PropTypes.arrayOf(
    PropTypes.shape({
      height: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
    }),
  ),
  /**
   * @ignore
   */
  loop: PropTypes.bool,
  /**
   * @ignore
   */
  onActiveIndexChange: PropTypes.func,
  /**
   * @ignore
   */
  orientation: PropTypes.oneOf(['both', 'horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CompositeRoot };
