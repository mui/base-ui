'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { FieldsetRootOwnerState, FieldsetRootProps } from './FieldsetRoot.types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldsetRootContext, type FieldsetRootContextValue } from './FieldsetRootContext';
import { useFieldsetRoot } from './useFieldsetRoot';

/**
 * The foundation for building custom-styled fieldsets.
 *
 * Demos:
 *
 * - [Fieldset](https://mui.com/base-ui/react-fieldset/)
 *
 * API:
 *
 * - [FieldsetRoot API](https://mui.com/base-ui/react-field/components-api/#fieldset-root)
 */
const FieldsetRoot = React.forwardRef(function FieldsetRoot(
  props: FieldsetRootProps,
  forwardedRef: React.ForwardedRef<HTMLFieldSetElement>,
) {
  const { render, className, disabled = false, ...otherProps } = props;

  const { legendId, setLegendId, getRootProps } = useFieldsetRoot();

  const ownerState: FieldsetRootOwnerState = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    ref: forwardedRef,
    render: render ?? 'fieldset',
    className,
    ownerState,
    extraProps: otherProps,
  });

  const contextValue: FieldsetRootContextValue = React.useMemo(
    () => ({
      legendId,
      setLegendId,
      disabled,
    }),
    [legendId, setLegendId, disabled],
  );

  return (
    <FieldsetRootContext.Provider value={contextValue}>
      {renderElement()}
    </FieldsetRootContext.Provider>
  );
});

FieldsetRoot.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FieldsetRoot };
