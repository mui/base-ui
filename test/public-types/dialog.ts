import type { Dialog } from '@base-ui/react/dialog';

export function getDialogChildren(props: Dialog.Root.Props<string>) {
  return props.children;
}
