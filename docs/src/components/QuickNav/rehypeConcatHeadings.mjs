/* eslint-disable no-plusplus */
import { headingRank } from 'hast-util-heading-rank';
import { toString } from 'hast-util-to-string';
import { visit, CONTINUE, EXIT } from 'unist-util-visit';
import { stringToUrl } from './rehypeSlug.mjs';

export function rehypeConcatHeadings() {
  return (tree) => {
    /**
     * Releases page: adds `id`s prefixed with a semver string to <h3>s
     */
    visit(tree, 'element', (node, _, parent) => {
      if (headingRank(node) === 1 && toString(node) !== 'Releases') {
        return EXIT;
      }

      if (headingRank(node) === 3) {
        let index = parent.children.indexOf(node);

        while (index--) {
          const candidate = toString(parent.children[index]);
          if (SEMVER_PATTERN.test(candidate) && !node.properties.id) {
            node.properties.id = `${candidate}-${stringToUrl(toString(node))}`;
            break;
          }
        }
      } else if (headingRank(node) && !node.properties.id) {
        node.properties.id = stringToUrl(toString(node));
      }
      return CONTINUE;
    });

    /**
     * Forms page: prefix <h3>s under React Hook Form/TanStack Form with the library name
     */
    visit(tree, 'element', (node, _, parent) => {
      if (headingRank(node) === 1 && toString(node) !== 'Forms') {
        return EXIT;
      }

      if (headingRank(node) === 3) {
        let index = parent.children.indexOf(node);
        while (index--) {
          const candidate = parent.children[index];
          if (headingRank(candidate) === 2) {
            const h2Text = toString(candidate);
            if (h2Text === 'React Hook Form' || h2Text === 'TanStack Form') {
              const h3Text = toString(node);
              node.properties.id = stringToUrl(`${h2Text} ${h3Text}`);
              break;
            }
          }
        }
      } else if (headingRank(node) && !node.properties.id) {
        node.properties.id = stringToUrl(toString(node));
      }
      return CONTINUE;
    });
  };
}

// Copied from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
// Adds `'v'` to beginning to match the headings.
const SEMVER_PATTERN =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/gm;
