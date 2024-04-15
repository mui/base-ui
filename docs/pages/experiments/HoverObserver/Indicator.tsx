import * as React from 'react';
import { HoverObserverContext } from './Root';

export default function HoverObserverIndicator(props: React.ComponentPropsWithRef<'div'>) {
  const context = React.useContext(HoverObserverContext);
  if (!context) {
    throw new Error('HoverObserverIndicator must be used within a HoverObserverRoot');
  }

  let style: React.CSSProperties | undefined;

  if (context.lastHoveredElementPosition) {
    style = {
      '--hovered-element-top': `${context.lastHoveredElementPosition.top}px`,
      '--hovered-element-right': `${context.lastHoveredElementPosition.right}px`,
      '--hovered-element-bottom': `${context.lastHoveredElementPosition.bottom}px`,
      '--hovered-element-left': `${context.lastHoveredElementPosition.left}px`,
      '--hovered-element-width': `${context.lastHoveredElementPosition.width}px`,
      '--hovered-element-height': `${context.lastHoveredElementPosition.height}px`,
    } as React.CSSProperties;
  }

  return <div style={style} {...props} />;
}
