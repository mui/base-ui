'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { styleHookMapping } from '../utils/styleHooks';
import { useScrub } from './useScrub';
import { NumberFieldScrubAreaContext } from './NumberFieldScrubAreaContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An interactive area where the user can click and drag to change the field value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldScrubArea = React.forwardRef(function NumberFieldScrubArea(
  componentProps: NumberFieldScrubArea.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    render,
    className,
    direction = 'horizontal',
    pixelSensitivity = 2,
    teleportDistance,
    ...elementProps
  } = componentProps;

  const { state } = useNumberFieldRootContext();

  const scrub = useScrub({
    pixelSensitivity,
    direction,
    teleportDistance,
  });

  const renderElement = useRenderElement('span', componentProps, {
    ref: [forwardedRef, scrub.scrubAreaRef],
    state,
    props: [scrub.props, elementProps],
    customStyleHookMapping: styleHookMapping,
  });

  const contextValue: NumberFieldScrubAreaContext = React.useMemo(
    () => ({
      ...scrub,
      direction,
      pixelSensitivity,
      teleportDistance,
    }),
    [scrub, direction, pixelSensitivity, teleportDistance],
  );

  return (
    <NumberFieldScrubAreaContext.Provider value={contextValue}>
      {renderElement()}
    </NumberFieldScrubAreaContext.Provider>
  );
});

export namespace NumberFieldScrubArea {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Cursor movement direction in the scrub area.
     * @default 'horizontal'
     */
    direction?: 'horizontal' | 'vertical';
    /**
     * Determines how many pixels the cursor must move before the value changes.
     * A higher value will make scrubbing less sensitive.
     * @default 2
     */
    pixelSensitivity?: number;
    /**
     * If specified, determines the distance that the cursor may move from the center
     * of the scrub area before it will loop back around.
     */
    teleportDistance?: number | undefined;
  }
}
