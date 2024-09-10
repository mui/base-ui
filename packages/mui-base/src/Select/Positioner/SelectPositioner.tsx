'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, FloatingPortal, inner, type Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { SelectPositionerContext } from './SelectPositionerContext';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectPositioner } from './useSelectPositioner';
import { HTMLElementType } from '../../utils/proptypes';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import { useLatestRef } from '../../utils/useLatestRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { CompositeList } from '../../Composite/List/CompositeList';

/**
 * Renders the element that positions the Select popup.
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectPositioner API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectPositioner)
 */
const SelectPositioner = React.forwardRef(function SelectPositioner(
  props: SelectPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    positionStrategy = 'absolute',
    className,
    render,
    keepMounted = false,
    side = 'bottom',
    alignment = 'start',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding,
    arrowPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    container,
    ...otherProps
  } = props;

  const {
    open,
    floatingRootContext,
    setPositionerElement,
    elementsRef,
    labelsRef,
    triggerElement,
    mounted,
    popupRef,
    overflowRef,
    innerOffset,
    alignMethod,
    innerFallback,
    setInnerFallback,
    selectedIndex,
    name,
    required,
    disabled,
    id: idProp,
    value,
    setValue,
    inputRef,
    getInputValidationProps,
    touchModality,
  } = useSelectRootContext();

  const { setControlId, validityData, setValidityData, setDirty } = useFieldRootContext();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const [optionTextOffset, setOptionTextOffset] = React.useState<number | null>(null);
  const [selectedIndexOnMount, setSelectedIndexOnMount] = React.useState(selectedIndex);

  if (optionTextOffset !== null && (!mounted || innerFallback)) {
    setOptionTextOffset(null);
  }

  const selectedIndexRef = useLatestRef(selectedIndex);

  useEnhancedEffect(() => {
    if (open) {
      setSelectedIndexOnMount(selectedIndexRef.current);
    }
  }, [open, selectedIndexRef]);

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && value !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: value }));
    }
  }, [value, setValidityData, validityData.initialValue]);

  const positioner = useSelectPositioner({
    anchor: anchor || triggerElement,
    floatingRootContext,
    positionStrategy,
    container,
    open,
    mounted,
    side,
    sideOffset,
    alignment,
    alignmentOffset: optionTextOffset ?? alignmentOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
    allowAxisFlip: false,
    innerFallback,
    inner:
      alignMethod === 'item' && selectedIndexOnMount !== null
        ? // Dependency-injected for tree-shaking purposes. Other floating element components don't
          // use or need this.
          inner({
            boundary: collisionBoundary,
            padding: collisionPadding ?? 10,
            listRef: elementsRef,
            index: selectedIndexOnMount,
            scrollRef: popupRef,
            offset: innerOffset,
            onFallbackChange(fallbackValue) {
              setInnerFallback(fallbackValue);
              if (fallbackValue && popupRef.current) {
                popupRef.current.style.maxHeight = '';
              }
            },
            minItemsVisible: touchModality ? 8 : 4,
            referenceOverflowThreshold: 20,
            overflowRef,
          })
        : undefined,
  });

  const ownerState: SelectPositioner.OwnerState = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      alignment: positioner.alignment,
    }),
    [open, positioner.side, positioner.alignment],
  );

  const contextValue: SelectPositionerContext = React.useMemo(
    () => ({
      isPositioned: positioner.isPositioned,
      side: positioner.side,
      alignment: positioner.alignment,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      arrowStyles: positioner.arrowStyles,
      floatingContext: positioner.floatingContext,
      optionTextOffset,
      setOptionTextOffset,
    }),
    [
      positioner.isPositioned,
      positioner.side,
      positioner.alignment,
      positioner.arrowRef,
      positioner.arrowUncentered,
      positioner.arrowStyles,
      positioner.floatingContext,
      optionTextOffset,
    ],
  );

  const setPositionerElementGuarded = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (open) {
        setPositionerElement(node);
      }
    },
    [open, setPositionerElement],
  );

  const mergedRef = useForkRef(forwardedRef, setPositionerElementGuarded);

  const { renderElement } = useComponentRenderer({
    propGetter: positioner.getPositionerProps,
    render: render ?? 'div',
    className,
    ownerState,
    customStyleHookMapping: commonStyleHooks,
    ref: mergedRef,
    extraProps: otherProps,
  });

  const positionerElement = renderElement();

  const serializedValue = React.useMemo(() => {
    if (value == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }, [value]);

  const mountedItemsElement = keepMounted ? null : <div hidden>{positionerElement}</div>;
  const nativeSelectElement = (
    <select
      {...mergeReactProps(getInputValidationProps(), {
        id,
        name,
        disabled,
        required,
        value,
        ref: inputRef,
        style: visuallyHidden,
        tabIndex: -1,
        'aria-hidden': true,
        onFocus() {
          // Move focus from the hidden <select> to the trigger element.
          triggerElement?.focus();
        },
        onChange(event: React.ChangeEvent<HTMLSelectElement>) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          const nextValue = event.target.value;

          setDirty(nextValue !== validityData.initialValue);
          setValue?.(nextValue, event.nativeEvent);
        },
      })}
    >
      <option value={serializedValue}>{serializedValue}</option>
    </select>
  );

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return (
      <SelectPositionerContext.Provider value={contextValue}>
        <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
          {nativeSelectElement}
          {mountedItemsElement}
        </CompositeList>
      </SelectPositionerContext.Provider>
    );
  }

  return (
    <SelectPositionerContext.Provider value={contextValue}>
      <CompositeList elementsRef={elementsRef} labelsRef={labelsRef}>
        {nativeSelectElement}
        <FloatingPortal root={props.container}>
          <FloatingFocusManager
            context={positioner.floatingContext}
            modal={false}
            disabled={!mounted}
          >
            {positionerElement}
          </FloatingFocusManager>
        </FloatingPortal>
      </CompositeList>
    </SelectPositionerContext.Provider>
  );
});

export { SelectPositioner };

export namespace SelectPositioner {
  export interface OwnerState {
    open: boolean;
    side: Side | 'none';
    alignment: 'start' | 'end' | 'center';
  }

  export interface Props
    extends useSelectPositioner.SharedParameters,
      BaseUIComponentProps<'div', OwnerState> {}
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
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.object,
    PropTypes.func,
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
   * @default 'clippingAncestors'
   */
  collisionBoundary: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.arrayOf(HTMLElementType),
    PropTypes.string,
    PropTypes.shape({
      height: PropTypes.number,
      width: PropTypes.number,
      x: PropTypes.number,
      y: PropTypes.number,
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
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * If `true`, the Select will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
  /**
   * Whether the select popup remains mounted in the DOM while closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * The CSS position strategy for positioning the Select popup element.
   * @default 'absolute'
   */
  positionStrategy: PropTypes.oneOf(['absolute', 'fixed']),
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
} as any;
