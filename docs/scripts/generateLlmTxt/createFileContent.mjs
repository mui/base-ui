/* eslint-disable no-await-in-loop */

import * as prettier from 'prettier';

export async function createFileContent({
  structure,
  preamble,
  pageRenderer,
  filePath,
  formatPages = false,
}) {
  const prettierOptions = await prettier.resolveConfig(filePath);
  const formatMarkdown = (content) =>
    prettier.format(content, {
      ...prettierOptions,
      filepath: filePath,
      parser: 'markdown',
    });

  const sections = [];

  for (const section of structure.sections) {
    if (section.pages.length === 0) {
      continue;
    }

    const sectionContent = [`## ${section.title}`, ''];

    for (const [pageIndex, page] of section.pages.entries()) {
      let renderedPage = await pageRenderer(page);

      if (formatPages) {
        renderedPage = await Promise.all(
          renderedPage.map(async (pageContent) => (await formatMarkdown(pageContent)).trimEnd()),
        );
      }

      sectionContent.push(...renderedPage);

      if (formatPages && pageIndex < section.pages.length - 1) {
        sectionContent.push('');
      }
    }

    sectionContent.push('');
    sections.push(...sectionContent);
  }

  const content = [...preamble, ...sections].join('\n');

  if (formatPages) {
    return `${content.trim()}\n`;
  }

  return formatMarkdown(content);
}
