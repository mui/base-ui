import rehypePrettyCode from 'rehype-pretty-code';
import { highlighter } from 'docs/src/syntax-highlighting';
import { rehypeInlineCode } from 'docs/src/syntax-highlighting/rehype-inline-code.mjs';
import { EvaluateOptions } from '@mdx-js/mdx';

const getHighlighter = () => highlighter;

interface MDXPlugins {
  rehypePlugins?: EvaluateOptions['rehypePlugins'];
  remarkPlugins?: EvaluateOptions['remarkPlugins'];
}

export const mdxPlugins = {
  rehypePlugins: [
    [
      rehypePrettyCode,
      {
        getHighlighter,
        grid: false,
        theme: 'base-ui',
        defaultLang: 'tsx',
      },
    ],
    rehypeInlineCode,
  ],
} satisfies MDXPlugins;
