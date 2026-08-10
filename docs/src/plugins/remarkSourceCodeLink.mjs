import { visit } from 'unist-util-visit';

const SOURCE_PAGE_PATH = /[/\\]react[/\\]\((?:components|utils)\)[/\\]([^/\\]+)[/\\]page\.mdx$/;

/**
 * Adds the package source path to the configured MDX component on component and utility pages.
 *
 * @param {{ componentName: string }} options
 */
export default function remarkSourceCodeLink({ componentName }) {
  return (tree, file) => {
    const sourceSlug =
      typeof file.path === 'string' ? SOURCE_PAGE_PATH.exec(file.path)?.[1] : undefined;

    if (sourceSlug == null) {
      return;
    }

    visit(tree, (node) => {
      if (node.name !== componentName || !Array.isArray(node.attributes)) {
        return;
      }

      const hasSourcePath = node.attributes.some(
        (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'sourcePath',
      );

      if (!hasSourcePath) {
        node.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'sourcePath',
          value: `packages/react/src/${sourceSlug}`,
        });
      }
    });
  };
}
