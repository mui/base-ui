'use client';
import { Tooltip } from '@base-ui/react/tooltip';

export function Trigger({ children, ...props }: Tooltip.Trigger.Props) {
  return <Tooltip.Trigger render={<div>{children}</div>} {...props} />;
}
