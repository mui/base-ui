import type { DialogRootProps } from '../../Dialog/Root/DialogRoot.types';

export type AlertDialogRootProps = Omit<DialogRootProps, 'modal' | 'softClose'>;
