'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../root/SelectRootContext';
import { CompositeList } from '../../composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useSelectPositioner } from './useSelectPositioner';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';

/**
 * Positions the select menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectPositioner = React.forwardRef(function SelectPositioner(
  props: SelectPositioner.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    positionMethod = 'absolute',
    className,
    render,
    side = 'bottom',
    align = 'start',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding,
    arrowPadding = 5,
    sticky = false,
    trackAnchor = true,
    ...otherProps
  } = props;

  const { open, mounted, setPositionerElement, listRef, labelsRef, floatingRootContext } =
    useSelectRootContext();

  const { getPositionerProps, positioner } = useSelectPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor,
    allowAxisFlip: false,
  });

  const mergedRef = useForkRef(ref, setPositionerElement);

  const state: SelectPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getPositionerProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    customStyleHookMapping: popupStateMapping,
    extraProps: otherProps,
  });

  return (
    <CompositeList elementsRef={listRef} labelsRef={labelsRef}>
      <SelectPositionerContext.Provider value={positioner}>
        {renderElement()}
      </SelectPositionerContext.Provider>
    </CompositeList>
  );
});

namespace SelectPositioner {
  export interface State {
    open: boolean;
    side: Side | 'none';
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends useSelectPositioner.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}

SelectPositioner.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The align of the Select element to the anchor element along its cross axis.
   * @default 'start'
   */
  align: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the Select element along its align axis.
   * @default 0
   */
  alignOffset: PropTypes.number,
  /**
   * The anchor element to which the Select popup will be placed at.
   */
  anchor: PropTypes.oneOfType([
    (props, propName) => {
      if (props[propName] == null) {
        return new Error(`Prop '${propName}' is required but wasn't specified`);
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
    PropTypes.func,
    PropTypes.shape({
      contextElement: (props, propName) => {
        if (props[propName] == null) {
          return null;
        }
        if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
          return new Error(`Expected prop '${propName}' to be of type Element`);
        }
        return null;
      },
      getBoundingClientRect: PropTypes.func.isRequired,
      getClientRects: PropTypes.func,
    }),
    PropTypes.shape({
      current: (props, propName) => {
        if (props[propName] == null) {
          return null;
        }
        if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
          return new Error(`Expected prop '${propName}' to be of type Element`);
        }
        return null;
      },
    }),
  ]),
  /**
   * Determines the padding between the arrow and the Select popup's edges. Useful when the popover
   * popup has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding: PropTypes.number,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The boundary that the Select element should be constrained to.
   * @default 'clipping-ancestors'
   */
  collisionBoundary: PropTypes.oneOfType([
    PropTypes.oneOf(['clipping-ancestors']),
    PropTypes.arrayOf((props, propName) => {
      if (props[propName] == null) {
        return new Error(`Prop '${propName}' is required but wasn't specified`);
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    }),
    (props, propName) => {
      if (props[propName] == null) {
        return new Error(`Prop '${propName}' is required but wasn't specified`);
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
    PropTypes.shape({
      height: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }),
  ]),
  /**
   * The padding of the collision boundary.
   * @default 5
   */
  collisionPadding: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      bottom: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number,
      top: PropTypes.number,
    }),
  ]),
  /**
   * The CSS position method for positioning the Select popup element.
   * @default 'absolute'
   */
  positionMethod: PropTypes.oneOf(['absolute', 'fixed']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the Select element should align to.
   * @default 'bottom'
   */
  side: PropTypes.oneOf(['bottom', 'inline-end', 'inline-start', 'left', 'right', 'top']),
  /**
   * The gap between the anchor element and the Select element.
   * @default 0
   */
  sideOffset: PropTypes.number,
  /**
   * If `true`, allow the Select to remain in stuck view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky: PropTypes.bool,
  /**
   * Whether the select popup continuously tracks its anchor after the initial positioning upon mount.
   * @default true
   */
  trackAnchor: PropTypes.bool,
} as any;

export { SelectPositioner };
