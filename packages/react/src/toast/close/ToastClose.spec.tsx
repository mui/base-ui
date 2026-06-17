import { Toast } from '@base-ui/react/toast';

<Toast.Close />;
<Toast.Close type="button" />;
<Toast.Close nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Toast.Close nativeButton={false} type="button" />;
