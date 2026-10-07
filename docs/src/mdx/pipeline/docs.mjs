import remarkTypography from 'remark-typography';

import transformMarkdownRelativePaths from '@mui/internal-docs-infra/pipeline/transformMarkdownRelativePaths';
import transformMarkdownCode from '@mui/internal-docs-infra/pipeline/transformMarkdownCode';
import transformHtmlCodeBlock from '@mui/internal-docs-infra/pipeline/transformHtmlCodeBlock';
import transformHtmlCodeInline from '@mui/internal-docs-infra/pipeline/transformHtmlCodeInline';
import enhanceCodeInline from '@mui/internal-docs-infra/pipeline/enhanceCodeInline';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import remarkQuickNavExcludeHeading from '../../components/QuickNav/remarkQuickNavExcludeHeading.mjs';
import rehypeEagerCodeBlocks from '../../components/CodeBlock/rehypeEagerCodeBlocks.mjs';
import rehypeSlug from '../../components/QuickNav/rehypeSlug.mjs';
import rehypeConcatHeadings from '../../components/QuickNav/rehypeConcatHeadings.mjs';
import rehypeQuickNav from '../../components/QuickNav/rehypeQuickNav.mjs';
import rehypeSubtitle from '../../components/Subtitle/rehypeSubtitle.mjs';
import rehypeKbd from '../../components/Kbd/rehypeKbd.mjs';

/** @type {import('unified').PluggableList} */
export const remarkPlugins = [
  remarkTypography,
  remarkQuickNavExcludeHeading,
  transformMarkdownRelativePaths,
  transformMarkdownCode,
];

/** @type {import('unified').PluggableList} */
export const rehypePlugins = [
  transformHtmlCodeBlock,
  rehypeEagerCodeBlocks,
  transformHtmlCodeInline,
  enhanceCodeInline,
  rehypeSlug,
  rehypeConcatHeadings,
  rehypeExtractToc,
  rehypeQuickNav,
  rehypeSubtitle,
  rehypeKbd,
];
