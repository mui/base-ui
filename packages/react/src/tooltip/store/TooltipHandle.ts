import type { TooltipStore, TooltipHandleStore } from './TooltipStore';
import { createNullTooltipStore } from './TooltipStore';
import { BasePopupHandle } from '../../utils/popups/popupHandle';

/**
 * Controls a Tooltip imperatively and associates detached `Tooltip.Trigger` components with a
 * `Tooltip.Root`. Create one with `Tooltip.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class TooltipHandle<Payload> extends BasePopupHandle<
  TooltipHandleStore<Payload>,
  TooltipStore<Payload>
> {
  constructor() {
    super(createNullTooltipStore<Payload>(), 'Tooltip');
  }
}

/**
 * Creates a new handle to connect a Tooltip.Root with detached Tooltip.Trigger components.
 */
export function createTooltipHandle<Payload>(): TooltipHandle<Payload> {
  return new TooltipHandle<Payload>();
}
