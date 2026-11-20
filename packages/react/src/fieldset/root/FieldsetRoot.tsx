'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FieldsetRootContext, useFieldsetRootContext } from './FieldsetRootContext';
import { useBaseUiId } from '../../internals/useBaseUiId';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * Groups a shared legend with related controls.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export const FieldsetRoot = React.forwardRef(function FieldsetRoot(
  componentProps: FieldsetRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  // `Fieldset.Legend` registers its id in a layout effect, which never runs on the server, so
  // the root generates the legend's id up front and points `aria-labelledby` at it until
  // registration has settled. Mirrors how `LabelableProvider` keeps `Field.Label` associated
  // during SSR. Layout effects run child-first, so by the time this one runs the legend has
  // already registered (or there is none), and both updates land in the same render.
  const defaultLegendId = useBaseUiId();
  const [registeredLegendId, setLegendId] = React.useState<string | undefined>(undefined);
  const [legendRegistrationSettled, setLegendRegistrationSettled] = React.useState(false);

  useIsoLayoutEffect(() => {
    setLegendRegistrationSettled(true);
  }, []);

  const legendId = registeredLegendId ?? (legendRegistrationSettled ? undefined : defaultLegendId);

  const parentDisabled = useFieldsetRootContext(true)?.disabled;
  const disabled = parentDisabled || disabledProp;

  const state: FieldsetRootState = {
    disabled,
  };

  const element = useRenderElement('fieldset', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        'aria-labelledby': legendId,
        disabled,
      },
      elementProps,
    ],
  });

  const contextValue: FieldsetRootContext = React.useMemo(
    () => ({
      legendId,
      defaultLegendId,
      setLegendId,
      disabled,
    }),
    [legendId, defaultLegendId, setLegendId, disabled],
  );

  return (
    <FieldsetRootContext.Provider value={contextValue}>{element}</FieldsetRootContext.Provider>
  );
});

export interface FieldsetRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface FieldsetRootProps extends BaseUIComponentProps<'fieldset', FieldsetRootState> {}

export namespace FieldsetRoot {
  export type State = FieldsetRootState;
  export type Props = FieldsetRootProps;
}
