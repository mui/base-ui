import { headingRank } from 'hast-util-heading-rank';
import { toString } from 'hast-util-to-string';
import { visit, EXIT } from 'unist-util-visit';
import { stringToUrl } from './rehypeSlug.mjs';

// Copied from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
// Adds `'v'` to beginning to match the headings.
const SEMVER_PATTERN =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/gm;

/**
 * Adds `id`s prefixed with a semver string to changelog headings.
 */
export function rehypeChangelog() {
  return (tree) => {
    visit(tree, 'element', (node, _, parent) => {
      if (headingRank(node) === 1 && toString(node) !== 'Releases') {
        return EXIT;
      }

      if (headingRank(node) === 3) {
        let index = parent.children.indexOf(node);

        // eslint-disable-next-line no-plusplus
        while (index--) {
          const child = parent.children[index];
          if (SEMVER_PATTERN.test(toString(child)) && !node.properties.id) {
            const version = toString(child);
            node.properties.id = `${version}-${stringToUrl(toString(node))}`;
          }
        }
      } else if (headingRank(node) && !node.properties.id) {
        node.properties.id = stringToUrl(toString(node));
      }
      return undefined;
    });
  };
}
