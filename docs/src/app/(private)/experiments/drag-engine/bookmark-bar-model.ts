export const ROOT_ID = 'root';

export type ParentId = typeof ROOT_ID | string;

export interface BookmarkNodeBase {
  id: string;
  name: string;
  parentId: ParentId;
}

export interface Bookmark extends BookmarkNodeBase {
  type: 'bookmark';
  url: string;
}

export interface BookmarkFolder extends BookmarkNodeBase {
  type: 'folder';
}

export type BookmarkNode = Bookmark | BookmarkFolder;

export interface BookmarkTree {
  nodes: Record<string, BookmarkNode>;
  children: Record<ParentId, string[]>;
}

export type BookmarkSeed =
  | { id: string; name: string; url: string }
  | { id: string; name: string; children: BookmarkSeed[] };

export type MoveValidity = boolean | 'reject';

const bookmark = (id: string, name: string, url: string): BookmarkSeed => ({ id, name, url });
const folder = (id: string, name: string, children: BookmarkSeed[]): BookmarkSeed => ({
  id,
  name,
  children,
});

const INITIAL_BOOKMARKS: BookmarkSeed[] = [
  bookmark('baseui', 'Base UI', 'https://base-ui.com/'),
  bookmark('github', 'GitHub', 'https://github.com/'),
  folder('work', 'Work', [
    bookmark('react', 'React', 'https://react.dev/'),
    bookmark('pullRequests', 'Pull requests', 'https://github.com/pulls'),
    bookmark('calendar', 'Calendar', 'https://calendar.google.com/'),
    bookmark('drive', 'Drive', 'https://drive.google.com/'),
    bookmark('notion', 'Notion', 'https://www.notion.so/'),
    bookmark('slack', 'Slack', 'https://app.slack.com/'),
    bookmark('jira', 'Jira', 'https://www.atlassian.com/software/jira'),
    bookmark('meet', 'Meet', 'https://meet.google.com/'),
    folder('design', 'Design', [
      bookmark('material', 'Material Design', 'https://m3.material.io/'),
      bookmark('radixColors', 'Radix Colors', 'https://www.radix-ui.com/colors'),
      bookmark('tailwindColors', 'Tailwind Colors', 'https://tailwindcss.com/docs/colors'),
      bookmark('openColor', 'Open Color', 'https://yeun.github.io/open-color/'),
      bookmark('lucide', 'Lucide', 'https://lucide.dev/'),
      bookmark('phosphor', 'Phosphor Icons', 'https://phosphoricons.com/'),
      bookmark('mobbin', 'Mobbin', 'https://mobbin.com/'),
      bookmark('contrast', 'Contrast checker', 'https://webaim.org/resources/contrastchecker/'),
      bookmark('typeScale', 'Type Scale', 'https://typescale.com/'),
      bookmark('easing', 'Easing functions', 'https://easings.net/'),
      bookmark('uiPatterns', 'UI Patterns', 'https://ui-patterns.com/'),
      bookmark('lawsOfUx', 'Laws of UX', 'https://lawsofux.com/'),
      bookmark('fontPair', 'Fontpair', 'https://www.fontpair.co/'),
    ]),
    folder('engineering', 'Engineering', [
      bookmark('githubActions', 'GitHub Actions', 'https://github.com/features/actions'),
      bookmark('npm', 'npm', 'https://www.npmjs.com/'),
      bookmark('vercel', 'Vercel', 'https://vercel.com/'),
      bookmark('sentry', 'Sentry', 'https://sentry.io/'),
      bookmark('datadog', 'Datadog', 'https://www.datadoghq.com/'),
      bookmark('bundlephobia', 'Bundlephobia', 'https://bundlephobia.com/'),
      bookmark('stackblitz', 'StackBlitz', 'https://stackblitz.com/'),
      bookmark('codesandbox', 'CodeSandbox', 'https://codesandbox.io/'),
    ]),
    folder('research', 'Research', [
      bookmark('caniuse', 'Can I use', 'https://caniuse.com/'),
      bookmark('webPlatform', 'Web Platform Tests', 'https://wpt.fyi/'),
      bookmark('npmTrends', 'npm trends', 'https://npmtrends.com/'),
    ]),
  ]),
  bookmark('mdn', 'MDN', 'https://developer.mozilla.org/'),
  folder('news', 'News', [
    bookmark('webkit', 'WebKit', 'https://webkit.org/blog/'),
    bookmark('chromium', 'Chromium', 'https://blog.chromium.org/'),
  ]),
  bookmark('typescript', 'TypeScript', 'https://www.typescriptlang.org/'),
  bookmark('linear', 'Linear', 'https://linear.app/'),
  bookmark('figma', 'Figma', 'https://www.figma.com/'),
  folder('reading', 'Reading', [
    folder('standards', 'Standards', [
      bookmark('aria', 'ARIA practices', 'https://www.w3.org/WAI/ARIA/apg/'),
      bookmark('html', 'HTML standard', 'https://html.spec.whatwg.org/'),
    ]),
  ]),
  bookmark('csswg', 'CSS Working Group', 'https://www.w3.org/Style/CSS/'),
  bookmark('stackOverflow', 'Stack Overflow', 'https://stackoverflow.com/'),
  bookmark('webDev', 'web.dev', 'https://web.dev/'),
  bookmark('codepen', 'CodePen', 'https://codepen.io/'),
  bookmark('githubTrending', 'GitHub Trending', 'https://github.com/trending'),
  bookmark('hackerNews', 'Hacker News', 'https://news.ycombinator.com/'),
  bookmark('wikipedia', 'Wikipedia', 'https://www.wikipedia.org/'),
  bookmark('youtube', 'YouTube', 'https://www.youtube.com/'),
  bookmark('productHunt', 'Product Hunt', 'https://www.producthunt.com/'),
  bookmark('smashing', 'Smashing Magazine', 'https://www.smashingmagazine.com/'),
  bookmark('cssTricks', 'CSS-Tricks', 'https://css-tricks.com/'),
  bookmark('webA11y', 'WebAIM', 'https://webaim.org/'),
  bookmark(
    'webFeatures',
    'Web Platform Features',
    'https://web-platform-dx.github.io/web-features/',
  ),
];

export function createBookmarkTree(seeds: BookmarkSeed[]): BookmarkTree {
  const tree: BookmarkTree = { nodes: {}, children: {} };

  function visit(items: BookmarkSeed[], parentId: ParentId) {
    tree.children[parentId] = items.map((item) => item.id);
    for (const item of items) {
      if ('url' in item) {
        tree.nodes[item.id] = {
          id: item.id,
          type: 'bookmark',
          name: item.name,
          url: item.url,
          parentId,
        };
      } else {
        tree.nodes[item.id] = {
          id: item.id,
          type: 'folder',
          name: item.name,
          parentId,
        };
        visit(item.children, item.id);
      }
    }
  }

  visit(seeds, ROOT_ID);
  return tree;
}

export const INITIAL_TREE = createBookmarkTree(INITIAL_BOOKMARKS);

export function getChildren(tree: BookmarkTree, parentId: ParentId): BookmarkNode[] {
  return (tree.children[parentId] ?? []).map((id) => tree.nodes[id]).filter(Boolean);
}

export function isSelfOrDescendant(
  tree: BookmarkTree,
  sourceId: string,
  parentId: ParentId,
): boolean {
  for (let current = parentId; current !== ROOT_ID; ) {
    if (current === sourceId) {
      return true;
    }
    const node = tree.nodes[current];
    if (!node) {
      return false;
    }
    current = node.parentId;
  }
  return false;
}

export function getMoveValidity(
  tree: BookmarkTree,
  sourceId: string,
  parentId: ParentId,
  index: number,
): MoveValidity {
  const source = tree.nodes[sourceId];
  if (!source || isSelfOrDescendant(tree, sourceId, parentId)) {
    return 'reject';
  }

  const destination = tree.children[parentId] ?? [];
  const destinationIndex = Math.max(0, Math.min(index, destination.length));
  if (source.parentId !== parentId) {
    return true;
  }

  const sourceIndex = destination.indexOf(sourceId);
  const adjustedIndex = sourceIndex < destinationIndex ? destinationIndex - 1 : destinationIndex;
  return adjustedIndex !== sourceIndex;
}

export function moveNode(
  tree: BookmarkTree,
  sourceId: string,
  parentId: ParentId,
  index: number,
): BookmarkTree {
  if (getMoveValidity(tree, sourceId, parentId, index) !== true) {
    return tree;
  }

  const source = tree.nodes[sourceId];
  const sourceChildren = tree.children[source.parentId] ?? [];
  const sourceIndex = sourceChildren.indexOf(sourceId);
  const destinationChildren = tree.children[parentId] ?? [];
  let destinationIndex = Math.max(0, Math.min(index, destinationChildren.length));

  if (source.parentId === parentId && sourceIndex < destinationIndex) {
    destinationIndex -= 1;
  }

  const nextSourceChildren = sourceChildren.filter((id) => id !== sourceId);
  const nextDestinationChildren =
    source.parentId === parentId ? nextSourceChildren : [...destinationChildren];
  nextDestinationChildren.splice(destinationIndex, 0, sourceId);

  return {
    nodes: { ...tree.nodes, [sourceId]: { ...source, parentId } },
    children: {
      ...tree.children,
      [source.parentId]: nextSourceChildren,
      [parentId]: nextDestinationChildren,
    },
  };
}

function collectNodeIds(tree: BookmarkTree, id: string, result: Set<string>) {
  result.add(id);
  for (const childId of tree.children[id] ?? []) {
    collectNodeIds(tree, childId, result);
  }
}

export function removeNode(tree: BookmarkTree, id: string): BookmarkTree {
  const node = tree.nodes[id];
  if (!node) {
    return tree;
  }

  const removedIds = new Set<string>();
  collectNodeIds(tree, id, removedIds);
  const nodes = { ...tree.nodes };
  const children = { ...tree.children };

  for (const removedId of removedIds) {
    delete nodes[removedId];
    delete children[removedId];
  }
  children[node.parentId] = (children[node.parentId] ?? []).filter((childId) => childId !== id);
  return { nodes, children };
}

export function collectUrls(tree: BookmarkTree, id: string, result: string[]) {
  const node = tree.nodes[id];
  if (!node) {
    return;
  }
  if (node.type === 'bookmark') {
    result.push(node.url);
    return;
  }
  for (const childId of tree.children[id] ?? []) {
    collectUrls(tree, childId, result);
  }
}

export function getFolderPath(tree: BookmarkTree, folderId: string): string {
  const names: string[] = [];
  for (let current = folderId; current !== ROOT_ID; ) {
    const node = tree.nodes[current];
    if (!node) {
      break;
    }
    names.unshift(node.name);
    current = node.parentId;
  }
  return names.join(' / ');
}

export function getVisibleCount(
  itemWidths: number[],
  moreWidth: number,
  gap: number,
  availableWidth: number,
): number {
  const totalWidth = itemWidths.reduce((sum, width) => sum + width, 0);
  const totalGaps = Math.max(0, itemWidths.length - 1) * gap;
  if (totalWidth + totalGaps <= availableWidth) {
    return itemWidths.length;
  }

  let usedWidth = moreWidth;
  let count = 0;
  for (const itemWidth of itemWidths) {
    const nextWidth = usedWidth + gap + itemWidth;
    if (nextWidth > availableWidth) {
      break;
    }
    usedWidth = nextWidth;
    count += 1;
  }
  return count;
}
