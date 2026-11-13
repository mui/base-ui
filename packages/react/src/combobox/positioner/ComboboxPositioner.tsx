'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { inertValue } from '@base-ui/utils/inertValue';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { ComboboxPositionerContext } from './ComboboxPositionerContext';
import { useListEmpty } from '../utils/parts';
import type {
  Side,
  Align,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import { useComboboxPortalContext } from '../portal/ComboboxPortalContext';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../internals/constants';
import { InternalBackdrop } from '../../utils/popups/InternalBackdrop';
import { usePopupPositioner } from '../../utils/popups/popupPositioner';
import { useAnchoredPopupScrollLock } from '../../utils/popups/useAnchoredPopupScrollLock';

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxPositioner = React.forwardRef(function ComboboxPositioner(
  componentProps: ComboboxPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = useComboboxRootContext();
  const keepMounted = useComboboxPortalContext();

  const modal = store.useState('modal');
  const openMethod = store.useState('openMethod');
  const positionerElement = store.useState('positionerElement');
  const triggerElement = store.useState('triggerElement');
  const inputElement = store.useState('inputElement');
  const inputGroupElement = store.useState('inputGroupElement');
  const inputInsidePopup = store.useState('inputInsidePopup');

  const empty = useListEmpty();

  const { element, positioning, open, mounted } = usePopupPositioner<ComboboxPositionerState>(
    store,
    componentProps,
    {
      forwardedRef,
      keepMounted,
      positioning: {
        anchor:
          componentProps.anchor ??
          (inputInsidePopup ? triggerElement : (inputGroupElement ?? inputElement)),
        collisionAvoidance: componentProps.collisionAvoidance ?? DROPDOWN_COLLISION_AVOIDANCE,
        lazyFlip: true,
      },
      state: { empty },
    },
  );

  useAnchoredPopupScrollLock(
    open && modal,
    openMethod === 'touch',
    positionerElement,
    triggerElement,
  );

  useIsoLayoutEffect(() => {
    store.set('popupSide', positioning.side);
  }, [store, positioning.side]);

  return (
    <ComboboxPositionerContext.Provider value={positioning}>
      {mounted && modal && (
        <InternalBackdrop
          inert={inertValue(!open)}
          cutout={inputGroupElement ?? inputElement ?? triggerElement}
        />
      )}
      {element}
    </ComboboxPositionerContext.Provider>
  );
});

export interface ComboboxPositionerState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether there are no items to display.
   */
  empty: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: 'click' | 'dismiss' | undefined;
}

export interface ComboboxPositionerProps
  extends
    UseAnchorPositioningSharedParameters,
    BaseUIComponentProps<'div', ComboboxPositionerState> {}

export namespace ComboboxPositioner {
  export type State = ComboboxPositionerState;
  export type Props = ComboboxPositionerProps;
}
