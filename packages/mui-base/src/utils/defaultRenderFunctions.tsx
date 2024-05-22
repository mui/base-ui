import * as React from 'react';

export const defaultRenderFunctions = {
  button: (props: React.ComponentPropsWithRef<'button'>) => {
    return <button type="button" {...props} />;
  },
  div: (props: React.ComponentPropsWithRef<'div'>) => {
    return <div {...props} />;
  },
  h2: (props: React.ComponentPropsWithRef<'h2'>) => {
    // eslint-disable-next-line jsx-a11y/heading-has-content
    return <h2 {...props} />;
  },
  p: (props: React.ComponentPropsWithRef<'p'>) => {
    return <p {...props} />;
  },
  span: (props: React.ComponentPropsWithRef<'span'>) => {
    return <span {...props} />;
  },
};
