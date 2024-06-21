'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuPopupOwnerState, MenuPopupProps } from './MenuPopup.types';
import { useMenuPopup } from './useMenuPopup';
import { MenuPopupContext, MenuPopupContextValue } from './MenuPopupContext';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useCompoundParent } from '../../useCompound';
import { ListItemMetadata } from '../../useList';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, id, ...other } = props;
  const { state, dispatch } = useMenuRootContext();
  const { subitems, context: compoundParentContext } = useCompoundParent<
    string,
    ListItemMetadata<string>
  >();

  const { getRootProps, getItemState } = useMenuPopup({
    state,
    dispatch,
    rootRef: forwardedRef,
    childItems: subitems,
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
  });

  const contextValue: MenuPopupContextValue = React.useMemo(
    () => ({ compoundParentContext, getItemState }),
    [compoundParentContext, getItemState],
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
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  className: PropTypes.string,
} as any;

export { MenuPopup };
