import { Toggle } from '@base-ui/react/toggle';

<Toggle />;
<Toggle type="button" />;
<Toggle nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Toggle nativeButton={false} type="button" />;
