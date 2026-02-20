import { Dialog } from '@base-ui/react/dialog';

<Dialog.Trigger />;
<Dialog.Trigger type="button" />;
<Dialog.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Dialog.Trigger nativeButton={false} type="button" />;
