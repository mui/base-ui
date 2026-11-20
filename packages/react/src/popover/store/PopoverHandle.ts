import type { PopoverStore, PopoverHandleStore } from './PopoverStore';
import { createNullPopoverStore } from './PopoverStore';
import { BasePopupHandle } from '../../utils/popups/popupHandle';

/**
 * Controls a Popover imperatively and associates detached `Popover.Trigger` components with a
 * `Popover.Root`. Create one with `Popover.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class PopoverHandle<Payload> extends BasePopupHandle<
  PopoverHandleStore<Payload>,
  PopoverStore<Payload>
> {
  constructor() {
    super(createNullPopoverStore<Payload>(), 'Popover');
  }
}

/**
 * Creates a new handle to connect a Popover.Root with detached Popover.Trigger components.
 */
export function createPopoverHandle<Payload>(): PopoverHandle<Payload> {
  return new PopoverHandle<Payload>();
}
