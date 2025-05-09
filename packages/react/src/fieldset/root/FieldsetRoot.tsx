'use client';
import * as React from 'react';
import { FieldsetRootContext } from './FieldsetRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Groups the fieldset legend and the associated fields.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export const FieldsetRoot = React.forwardRef(function FieldsetRoot(
  componentProps: FieldsetRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, disabled = false, ...elementProps } = componentProps;

  const [legendId, setLegendId] = React.useState<string | undefined>(undefined);

  const state: FieldsetRoot.State = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const renderElement = useRenderElement('fieldset', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        'aria-labelledby': legendId,
      },
      elementProps,
    ],
  });

  const contextValue: FieldsetRootContext = React.useMemo(
    () => ({
      legendId,
      setLegendId,
      disabled,
    }),
    [legendId, setLegendId, disabled],
  );

  return (
    <FieldsetRootContext.Provider value={contextValue}>
      {renderElement()}
    </FieldsetRootContext.Provider>
  );
});

export namespace FieldsetRoot {
  export type State = {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  };

  export interface Props extends BaseUIComponentProps<'fieldset', State> {}
}
