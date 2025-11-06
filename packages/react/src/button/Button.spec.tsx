import { Button } from '@base-ui-components/react/button';

<Button />;
<Button type="submit" form="form-id" name="action" />;

<Button nativeButton={false} render={<span />} />;
<Button nativeButton={false} render={(props) => <div {...props} />} />;
<Button nativeButton={false} disabled render={<span />} />;

// @ts-expect-error native buttons only
<Button nativeButton={false} type="submit" render={<span />} />;
// @ts-expect-error native buttons only
<Button nativeButton={false} form="form-id" render={<span />} />;
// @ts-expect-error native buttons only
<Button nativeButton={false} name="action" render={<span />} />;
