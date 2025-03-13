import * as React from 'react';

export function button(props: React.ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}
