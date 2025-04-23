'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldsetRootContext } from './FieldsetRootContext';
import { useFieldsetRoot } from './useFieldsetRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Groups the fieldset legend and the associated fields.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
const FieldsetRoot = React.forwardRef(function FieldsetRoot(
  props: FieldsetRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, disabled = false, ...otherProps } = props;

  const { legendId, setLegendId, getRootProps } = useFieldsetRoot();

  const state: FieldsetRoot.State = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    ref: forwardedRef,
    render: render ?? 'fieldset',
    className,
    state,
    extraProps: otherProps,
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

namespace FieldsetRoot {
  export type State = {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  };

  export interface Props extends BaseUIComponentProps<'fieldset', State> {}
}

export { FieldsetRoot };
