'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { useSelectOptionGroupContext } from '../OptionGroup/SelectOptionGroupContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useSelectRootContext } from '../Root/SelectRootContext';

const SelectOptionGroupLabel = React.forwardRef(function SelectOptionGroupLabel(
  props: SelectOptionGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...otherProps } = props;

  const { open } = useSelectRootContext();
  const { setLabelId } = useSelectOptionGroupContext();

  const ownerState: SelectOptionGroupLabel.OwnerState = React.useMemo(
    () => ({
      open,
    }),
    [open],
  );

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setLabelId(id);
  }, [id, setLabelId]);

  const getSelectOptionGroupLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
      }),
    [id],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSelectOptionGroupLabelProps,
    render: render ?? 'div',
    ref: forwardedRef,
    ownerState,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

SelectOptionGroupLabel.propTypes /* remove-proptypes */ = {
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
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace SelectOptionGroupLabel {
  export interface OwnerState {
    open: boolean;
  }
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

export { SelectOptionGroupLabel };
