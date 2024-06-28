'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuPopupOwnerState, MenuPopupProps } from './MenuPopup.types';
import { useMenuPopup } from './useMenuPopup';
import { MenuPopupContext, MenuPopupContextValue } from './MenuPopupContext';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, id, ...other } = props;
  const { state, dispatch } = useMenuRootContext();

  const { getRootProps, compoundParentContext } = useMenuPopup({
    state,
    dispatch,
    id,
  });

  const ownerState: MenuPopupOwnerState = { open: state.open };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    propGetter: getRootProps,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    },
    extraProps: other,
    ref: forwardedRef,
  });

  const contextValue: MenuPopupContextValue = React.useMemo(
    () => ({ compoundParentContext }),
    [compoundParentContext],
  );

  return (
    <MenuPopupContext.Provider value={contextValue}>{renderElement()}</MenuPopupContext.Provider>
  );
});

MenuPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref with imperative actions that can be performed on the menu.
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

export { MenuPopup };
