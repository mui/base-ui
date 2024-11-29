'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../root/SelectRootContext';
import { CompositeList } from '../../composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';
import { useSelectPositioner } from './useSelectPositioner';
import type { Alignment, Side } from '../../utils/useAnchorPositioning';
import { SelectPositionerContext } from './SelectPositionerContext';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectPositioner API](https://base-ui.com/components/react-select/#api-reference-SelectPositioner)
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
    alignment = 'start',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding,
    arrowPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    trackAnchor = true,
    container,
    ...otherProps
  } = props;

  const { open, mounted, setPositionerElement, listRef, labelsRef, floatingRootContext } =
    useSelectRootContext();

  const { getPositionerProps, positioner } = useSelectPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    container,
    mounted,
    side,
    sideOffset,
    alignment,
    alignmentOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
    trackAnchor,
    allowAxisFlip: false,
  });

  const mergedRef = useForkRef(ref, setPositionerElement);

  const state: SelectPositioner.State = React.useMemo(
    () => ({
      open,
      hidden: !mounted,
      side: positioner.side,
      alignment: positioner.alignment,
    }),
    [open, mounted, positioner.side, positioner.alignment],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getPositionerProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    customStyleHookMapping: popupOpenStateMapping,
    extraProps: otherProps,
  });

  return (
    <CompositeList elementsRef={listRef} labelsRef={labelsRef}>
      <FloatingPortal root={container}>
        <SelectPositionerContext.Provider value={positioner}>
          {renderElement()}
        </SelectPositionerContext.Provider>
      </FloatingPortal>
    </CompositeList>
  );
});

namespace SelectPositioner {
  export interface State {
    open: boolean;
    hidden: boolean;
    side: Side | 'none';
    alignment: Alignment;
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
   * The alignment of the Select element to the anchor element along its cross axis.
   * @default 'start'
   */
  alignment: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the Select element along its alignment axis.
   * @default 0
   */
  alignmentOffset: PropTypes.number,
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
   * The container element to which the Select popup will be appended to.
   */
  container: PropTypes.oneOfType([
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
   * If `true`, the Select will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
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
  side: PropTypes.oneOf(['bottom', 'left', 'right', 'top']),
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
