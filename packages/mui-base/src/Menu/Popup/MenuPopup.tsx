'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { HTMLElementType, refType } from '@mui/utils';
import { MenuPopupOwnerState, MenuPopupProps } from './MenuPopup.types';
import { useMenu } from '../../useMenu';
import { MenuProvider } from '../../useMenu/MenuProvider';
import { Unstable_Popup as Popup } from '../../Unstable_Popup';
import { useSlotProps } from '../../utils/useSlotProps';
import { ListActionTypes } from '../../useList';

/**
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/)
 *
 * API:
 *
 * - [Menu API](https://mui.com/base-ui/react-menu/components-api/#menu)
 */
const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { actions, anchor: anchorProp, children, onItemsChange, ...other } = props;

  const { contextValue, getListboxProps, dispatch, open, triggerElement } = useMenu({
    onItemsChange,
    componentName: 'Menu',
  });

  const anchor = anchorProp ?? triggerElement;

  React.useImperativeHandle(
    actions,
    () => ({
      dispatch,
      resetHighlight: () => dispatch({ type: ListActionTypes.resetHighlight, event: null }),
    }),
    [dispatch],
  );

  const ownerState: MenuPopupOwnerState = { ...props, open };

  const Root = 'div';
  const rootProps = useSlotProps({
    elementType: Root,
    externalSlotProps: {},
    externalForwardedProps: other,
    additionalProps: {
      ref: forwardedRef,
      role: undefined,
    },
    ownerState,
  });

  const Listbox = 'ul';
  const listboxProps = useSlotProps({
    elementType: Listbox,
    getSlotProps: getListboxProps,
    externalSlotProps: {},
    ownerState,
  });

  if (open === true && anchor == null) {
    return (
      <Root {...rootProps}>
        <Listbox {...listboxProps}>
          <MenuProvider value={contextValue}>{children}</MenuProvider>
        </Listbox>
      </Root>
    );
  }

  return (
    <Popup keepMounted {...rootProps} open={open} anchor={anchor} slots={{ root: Root }}>
      <Listbox {...listboxProps}>
        <MenuProvider value={contextValue}>{children}</MenuProvider>
      </Listbox>
    </Popup>
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
  actions: refType,
  /**
   * The element based on which the menu is positioned.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.object,
    PropTypes.func,
  ]),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * Function called when the items displayed in the menu change.
   */
  onItemsChange: PropTypes.func,
  /**
   * The props used for each slot inside the Menu.
   * @default {}
   */
  slotProps: PropTypes.shape({
    listbox: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  }),
  /**
   * The components used for each slot inside the Menu.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.shape({
    listbox: PropTypes.elementType,
    root: PropTypes.elementType,
  }),
} as any;

export { MenuPopup };
