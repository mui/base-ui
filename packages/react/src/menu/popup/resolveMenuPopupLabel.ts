import * as React from 'react';

interface MenuPopupLabelProps {
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  render?: unknown;
}

export function resolveMenuPopupLabel(
  props: MenuPopupLabelProps,
  activeTriggerElement: Element | null,
  activeTriggerId: string | null,
) {
  const renderedElementProps = React.isValidElement(props.render)
    ? (props.render.props as React.HTMLAttributes<HTMLElement>)
    : undefined;
  const ariaLabel = props['aria-label'] ?? renderedElementProps?.['aria-label'];
  let ariaLabelledBy = props['aria-labelledby'] ?? renderedElementProps?.['aria-labelledby'];

  if (ariaLabelledBy == null && !ariaLabel) {
    ariaLabelledBy = activeTriggerElement?.id ?? activeTriggerId ?? undefined;
  }

  return { ariaLabel, ariaLabelledBy };
}
