import { Toggle } from '@base-ui/react/toggle';

<Toggle />;
<Toggle value="left" />;

// @ts-expect-error - Value must extend string
<Toggle value={1} />;

<Toggle<'left'> value="left" />;
// @ts-expect-error - Value is constrained by the generic
<Toggle<'left'> value="right" />;
