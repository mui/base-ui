import * as React from 'react';

export const defaultRenderFunctions = {
  button: (props: React.ComponentPropsWithRef<'button'>) => {
    // eslint-disable-next-line react/button-has-type
    return <button {...props} />;
  },
  div: (props: React.ComponentPropsWithRef<'div'>) => {
    return <div {...props} />;
  },
};
