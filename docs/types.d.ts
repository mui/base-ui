/// <reference types="gtag.js" />

declare module 'gtag.js';

declare module '*.mdx' {
  const MDXComponent: (props) => JSX.Element;
  export default MDXComponent;
}

declare module '*.css';
