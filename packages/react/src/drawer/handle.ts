import { DialogHandle } from '../dialog/store/DialogHandle';

/**
 * Controls a Drawer imperatively and associates detached `Drawer.Trigger` components with a
 * `Drawer.Root`. Create one with `Drawer.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class DrawerHandle<Payload> extends DialogHandle<Payload> {
  // Nominal brand: makes this handle type distinct from `DialogHandle` and sibling handles so they
  // can't be passed interchangeably. Type-only; has no runtime presence.
  private readonly __drawerBrand!: never;
}

/**
 * Creates a new handle to connect a Drawer.Root with detached Drawer.Trigger components.
 */
export function createDrawerHandle<Payload>(): DrawerHandle<Payload> {
  return new DrawerHandle<Payload>();
}
