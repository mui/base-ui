import * as React from 'react';

export const defaultRenderFunctions = {
  button: (props: React.ComponentPropsWithRef<'button'>) => {
    return <button type="button" {...props} />;
  },
  div: (props: React.ComponentPropsWithRef<'div'>) => {
    return <div {...props} />;
  },
  span: (props: React.ComponentPropsWithRef<'span'>) => {
    return <span {...props} />;
  },
};
