import * as React from 'react';

export const defaultRenderFunctions = {
  button: (props: React.ComponentPropsWithRef<'button'>) => {
    return <button type="button" {...props} />;
  },
  div: (props: React.ComponentPropsWithRef<'div'>) => {
    return <div {...props} />;
  },
  h2: (props: React.ComponentPropsWithRef<'h2'>) => {
    return <h2 {...props} />;
  },
  h3: (props: React.ComponentPropsWithRef<'h3'>) => {
    return <h3 {...props} />;
  },
  output: (props: React.ComponentPropsWithRef<'output'>) => {
    return <output {...props} />;
  },
  p: (props: React.ComponentPropsWithRef<'p'>) => {
    return <p {...props} />;
  },
  span: (props: React.ComponentPropsWithRef<'span'>) => {
    return <span {...props} />;
  },
  a: (props: React.ComponentPropsWithRef<'a'>) => {
    return <a {...props} />;
  },
  label: (props: React.ComponentPropsWithRef<'label'>) => {
    return <label {...props} />;
  },
  input: (props: React.ComponentPropsWithRef<'input'>) => {
    return <input {...props} />;
  },
  fieldset: (props: React.ComponentPropsWithRef<'fieldset'>) => {
    return <fieldset {...props} />;
  },
  form: (props: React.ComponentPropsWithRef<'form'>) => {
    return <form {...props} />;
  },
  img: (props: React.ComponentPropsWithRef<'img'>) => {
    return <img alt="" {...props} />;
  },
};
