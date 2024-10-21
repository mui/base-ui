'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectOptionContext } from '../Option/SelectOptionContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';

const customStyleHookMapping: CustomStyleHookMapping<SelectOptionIndicator.OwnerState> =
  popupOpenStateMapping;

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectOptionIndicator API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectOptionIndicator)
 */
const SelectOptionIndicator = React.forwardRef(function SelectOptionIndicator(
  props: SelectOptionIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...otherProps } = props;

  const { open } = useSelectRootContext();
  const { selected } = useSelectOptionContext();

  const getOptionProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        'aria-hidden': true,
        children: '✔️',
      }),
    [],
  );

  const ownerState: SelectOptionIndicator.OwnerState = React.useMemo(
    () => ({
      open,
      selected,
    }),
    [open, selected],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getOptionProps,
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    ownerState,
    customStyleHookMapping,
    extraProps: otherProps,
  });

  const shouldRender = selected || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace SelectOptionIndicator {
  export interface Props extends BaseUIComponentProps<'span', OwnerState> {
    children?: React.ReactNode;
    /**
     * If `true`, the item indicator remains mounted when the item is not
     * selected.
     * @default true
     */
    keepMounted?: boolean;
  }

  export interface OwnerState {
    open: boolean;
    selected: boolean;
  }
}

SelectOptionIndicator.propTypes /* remove-proptypes */ = {
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
   * If `true`, the item indicator remains mounted when the item is not
   * selected.
   * @default true
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectOptionIndicator };
