'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Side, useFloatingTree } from '@floating-ui/react';
import { useMenuPopup } from './useMenuPopup';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useMenuPositionerContext } from '../Positioner/MenuPositionerContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping';

const customStyleHookMapping: CustomStyleHookMapping<MenuPopup.OwnerState> = {
  ...baseMapping,
  transitionStatus(value) {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }
    return null;
  },
};

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuPopup API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuPopup)
 */
const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { open, setOpen, popupRef, transitionStatus } = useMenuRootContext();
  const { side, alignment } = useMenuPositionerContext();
  const { events: menuEvents } = useFloatingTree()!;

  useMenuPopup({
    setOpen,
    menuEvents,
  });

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const ownerState: MenuPopup.OwnerState = React.useMemo(
    () => ({
      transitionStatus,
      side,
      alignment,
      open,
    }),
    [transitionStatus, side, alignment, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    extraProps: other,
    customStyleHookMapping,
    ref: mergedRef,
  });

  return renderElement();
});

namespace MenuPopup {
  export type Props = BaseUIComponentProps<'div', OwnerState> & {
    children?: React.ReactNode;
    /**
     * The id of the popup element.
     */
    id?: string;
  };

  export type OwnerState = {
    transitionStatus: TransitionStatus;
    side: Side;
    alignment: 'start' | 'end' | 'center';
    open: boolean;
  };
}

MenuPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.object,
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
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toExponential: PropTypes.func.isRequired,
      toFixed: PropTypes.func.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toPrecision: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      then: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The id of the popup element.
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuPopup };
