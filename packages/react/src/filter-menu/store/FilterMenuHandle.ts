import { MenuHandle } from '../../menu/store/MenuHandle';

/**
 * Controls a FilterMenu imperatively and associates detached `FilterMenu.Trigger` components
 * with a `FilterMenu.Root`. Create one with `FilterMenu.createHandle()` and pass it to the
 * `handle` prop of the root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class FilterMenuHandle<Payload> extends MenuHandle<Payload> {}

/**
 * Creates a new handle to connect a FilterMenu.Root with detached FilterMenu.Trigger components.
 */
export function createFilterMenuHandle<Payload>(): FilterMenuHandle<Payload> {
  return new FilterMenuHandle<Payload>();
}
