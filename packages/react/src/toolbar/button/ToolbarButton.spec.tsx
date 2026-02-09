import { Toolbar } from '@base-ui/react/toolbar';

<Toolbar.Button />;
<Toolbar.Button type="button" />;
<Toolbar.Button nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Toolbar.Button nativeButton={false} type="button" />;
