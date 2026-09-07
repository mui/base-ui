import { expectType } from '#test-utils';
import { Toolbar } from '@base-ui/react/toolbar';

// `Toolbar.Link` exposes the native `<a>` props in its `render` callback.
<Toolbar.Link
  render={(props) => {
    expectType<string | undefined, typeof props.href>(props.href);
    return <a {...props} />;
  }}
/>;
