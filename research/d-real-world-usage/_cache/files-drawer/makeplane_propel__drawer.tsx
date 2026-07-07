import { Drawer as BaseDrawer } from "@base-ui/react/drawer";

export type DrawerProps = Omit<BaseDrawer.Root.Props, "className" | "style">;

/**
 * The drawer Root that holds open state and gesture configuration. Uncontrolled by default; pass
 * `defaultOpen` (uncontrolled) or `open` + `onOpenChange` (controlled). Native props like
 * `swipeDirection` and snap points pass straight through. A behavior-only role that renders no
 * element of its own (rules 1a, 2), so it lives in `components`; the styled parts live in
 * `elements/drawer` and are grafted onto Base UI behavior here.
 */
export function Drawer(props: DrawerProps) {
  return <BaseDrawer.Root {...props} />;
}
