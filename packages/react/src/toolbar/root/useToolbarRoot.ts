'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

function useToolbarRoot(parameters: useToolbarRoot.Parameters): useToolbarRoot.ReturnValue {
  const { orientation } = parameters;

  const getRootProps = React.useCallback(
    (otherProps = {}): React.ComponentPropsWithRef<'div'> => {
      return mergeReactProps(otherProps, {
        'aria-orientation': orientation,
        role: 'toolbar',
      });
    },
    [orientation],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}

namespace useToolbarRoot {
  export interface Parameters {
    /**
     * The component orientation (layout flow direction).
     */
    orientation: 'horizontal' | 'vertical';
  }

  export interface ReturnValue {
    /**
     * Resolver for the Toolbar component's props.
     * @param externalProps additional props for Toolbar.Root
     * @returns props that should be spread on Toolbar.Root
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}

export { useToolbarRoot };
