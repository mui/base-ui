import { Dialog } from '@base-ui/react/dialog';

<Dialog.Close />;
<Dialog.Close type="button" />;
<Dialog.Close nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Dialog.Close nativeButton={false} type="button" />;
