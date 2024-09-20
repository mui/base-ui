'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useSelectPositionerContext } from '../Positioner/SelectPositionerContext';
import { useSelectOptionContext } from '../Option/SelectOptionContext';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectOptionText API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectOptionText)
 */
const SelectOptionText = React.forwardRef(function SelectOptionText(
  props: SelectOptionText.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, triggerElement, valueRef, popupRef, innerFallback, alignMethod } =
    useSelectRootContext();
  const { isPositioned, setOptionTextOffset } = useSelectPositionerContext();
  const { selected } = useSelectOptionContext();

  const textRef = React.useRef<HTMLDivElement>(null);
  const mergedRef = useForkRef(forwardedRef, textRef);

  const ownerState: SelectOptionText.OwnerState = React.useMemo(() => ({}), []);

  useEnhancedEffect(() => {
    if (
      alignMethod !== 'item' ||
      innerFallback ||
      !open ||
      !isPositioned ||
      !selected ||
      !triggerElement ||
      !valueRef.current ||
      !textRef.current ||
      !popupRef.current
    ) {
      return;
    }

    const triggerX = triggerElement.getBoundingClientRect().left;
    const valueX = valueRef.current.getBoundingClientRect().left;
    const popupX = popupRef.current.getBoundingClientRect().left;
    const textX = textRef.current.getBoundingClientRect().left;

    const triggerDiff = valueX - triggerX;
    const popupDiff = textX - popupX;

    setOptionTextOffset(triggerDiff - popupDiff);
  }, [
    alignMethod,
    innerFallback,
    open,
    isPositioned,
    popupRef,
    selected,
    setOptionTextOffset,
    triggerElement,
    valueRef,
  ]);

  const { renderElement } = useComponentRenderer({
    ref: mergedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

SelectOptionText.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectOptionText };

namespace SelectOptionText {
  export interface OwnerState {}
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}
