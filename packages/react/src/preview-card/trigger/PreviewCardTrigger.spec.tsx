import { expectType } from '#test-utils';
import { PreviewCard } from '@base-ui/react/preview-card';

// `PreviewCard.Trigger` exposes the native `<a>` props in its `render` callback.
<PreviewCard.Trigger
  render={(props) => {
    expectType<string | undefined, typeof props.href>(props.href);
    return <a {...props} />;
  }}
/>;
