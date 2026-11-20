'use client';
import * as React from 'react';
import { FieldsetRootContext, useFieldsetRootContext } from './FieldsetRootContext';
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

  const [legendId, setLegendId] = React.useState<string | undefined>(undefined);
  const [descriptionIds, setDescriptionIds] = React.useState<string[]>([]);

  const parentDisabled = useFieldsetRootContext(true)?.disabled;
  const disabled = parentDisabled || disabledProp;

  const state: FieldsetRootState = {
    disabled,
  };

  const describedBy =
    Array.from(
      new Set([...(elementProps['aria-describedby']?.split(' ') ?? []), ...descriptionIds]),
    ).join(' ') || undefined;

  const element = useRenderElement('fieldset', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        'aria-labelledby': legendId,
        disabled,
      },
      elementProps,
      { 'aria-describedby': describedBy },
    ],
  });

  const contextValue: FieldsetRootContext = React.useMemo(
    () => ({
      legendId,
      setLegendId,
      setDescriptionIds,
      disabled,
    }),
    [legendId, setLegendId, setDescriptionIds, disabled],
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
