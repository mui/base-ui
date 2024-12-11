'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useSelectGroupContext } from '../group/SelectGroupContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

const state = {};

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectGroupLabel = React.forwardRef(function SelectGroupLabel(
  props: SelectGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...otherProps } = props;

  const { setLabelId } = useSelectGroupContext();

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setLabelId(id);
  }, [id, setLabelId]);

  const getSelectItemGroupLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
      }),
    [id],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSelectItemGroupLabelProps,
    render: render ?? 'div',
    ref: forwardedRef,
    state,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectGroupLabel {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

SelectGroupLabel.propTypes /* remove-proptypes */ = {
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
  id: PropTypes.string,
  /**
   * Allows you to replace the default HTML element that the component
   * renders with another element, or compose it with another component.
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectGroupLabel };
