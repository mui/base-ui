'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { useId } from '../../utils/useId.js';
import { useMenuGroupRootContext } from '../Group/MenuGroupContext.js';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect.js';

const ownerState = {};

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuGroupLabel API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuGroupLabel)
 */
const MenuGroupLabel = React.forwardRef(function MenuGroupLabelComponent(
  props: MenuGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...other } = props;

  const id = useId(idProp);

  const { setLabelId } = useMenuGroupRootContext();

  useEnhancedEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(undefined);
    };
  }, [setLabelId, id]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: { role: 'group', id, ...other },
    ref: forwardedRef,
  });

  return renderElement();
});

MenuGroupLabel.propTypes /* remove-proptypes */ = {
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

namespace MenuGroupLabel {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}

  export interface OwnerState {}
}

export { MenuGroupLabel };
