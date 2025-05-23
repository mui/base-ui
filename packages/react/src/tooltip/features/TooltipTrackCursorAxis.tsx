import * as React from 'react';
import { ElementProps, useClientPoint } from '@floating-ui/react';
import { useTooltipRootContext } from '../root/TooltipRootContext';

export interface TooltipTrackCursorAxisContext {
  elementProps: ElementProps | undefined;
  value: 'both' | 'x' | 'y' | 'none';
}

export const TooltipTrackCursorAxisContext = React.createContext<TooltipTrackCursorAxisContext>({
  elementProps: {},
  value: 'none',
});

export function TooltipTrackCursorAxis(props: TrackCursorAxis.Props) {
  const { floatingRootContext, disabled } = useTooltipRootContext();
  const { value } = props;

  const clientPoint = useClientPoint(floatingRootContext, {
    enabled: !disabled && value !== 'none',
    axis: value === 'none' ? undefined : value,
  });

  const contextValue: TooltipTrackCursorAxisContext = React.useMemo(
    () => ({
      elementProps: clientPoint,
      value,
    }),
    [clientPoint, value],
  );

  return (
    <TooltipTrackCursorAxisContext.Provider value={contextValue}>
      {props.children}
    </TooltipTrackCursorAxisContext.Provider>
  );
}

export namespace TrackCursorAxis {
  export interface Props {
    children: React.ReactNode;
    value: 'both' | 'x' | 'y' | 'none';
  }
}

export function useTooltipTrackCursorAxisContext() {
  return React.useContext(TooltipTrackCursorAxisContext);
}
