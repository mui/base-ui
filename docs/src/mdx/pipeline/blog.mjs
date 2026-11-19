import remarkTypography from 'remark-typography';

import transformMarkdownCode from '@mui/internal-docs-infra/pipeline/transformMarkdownCode';
import transformHtmlCodeBlock from '@mui/internal-docs-infra/pipeline/transformHtmlCodeBlock';
import transformHtmlCodeInline from '@mui/internal-docs-infra/pipeline/transformHtmlCodeInline';
import enhanceCodeInline from '@mui/internal-docs-infra/pipeline/enhanceCodeInline';
import rehypeEagerCodeBlocks from '../../components/CodeBlock/rehypeEagerCodeBlocks.mjs';
import rehypeSlug from '../../components/QuickNav/rehypeSlug.mjs';
import rehypeKbd from '../../components/Kbd/rehypeKbd.mjs';

/** @type {import('unified').PluggableList} */
export const remarkPlugins = [remarkTypography, transformMarkdownCode];

/** @type {import('unified').PluggableList} */
export const rehypePlugins = [
  transformHtmlCodeBlock,
  rehypeEagerCodeBlocks,
  transformHtmlCodeInline,
  enhanceCodeInline,
  rehypeSlug,
  rehypeKbd,
];
