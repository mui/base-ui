import {
  bulletList,
  creditAuthors,
  formatAuthor,
  formatDate,
  formatReference,
  formatSubHeader,
  groupBy,
  joinBlocks,
  joinWords,
  labelValues,
  matchPrefix,
  parseTitle,
  section,
} from '@mui/internal-code-infra/changelog';
import type { ChangelogChange, ChangelogData } from '@mui/internal-code-infra/changelog';

const GENERAL_CHANGES = 'General changes';
const BREAKING_CHANGE = '🚨 **Breaking change:**';
const ALL_COMPONENTS_LABEL = 'scope: all components';

const EXCLUDED_LABELS = new Set([
  'dependencies',
  'docs',
  'examples',
  'experiments',
  'internal',
  'release',
  'scope: code-infra',
  'scope: docs-infra',
  'scope: support-infra',
  'scope: temporal',
  'test',
  'website',
]);

const EXCLUDED_PREFIXES = new Set(['utils', 'internals', 'example', 'examples', 'experiments']);
const EXCLUDED_CONTRIBUTORS = new Set(['Copilot']);

/** Title prefixes of parts that have no section of their own. */
const COMPONENT_OF = new Map([['radio', 'radio group']]);
const HEADINGS = new Map([['otp field', 'OTP Field']]);

// Pinned, so that the order doesn't depend on the locale of the machine.
const COLLATOR = new Intl.Collator('en');

function getHeading(component: string) {
  if (component !== component.toLowerCase()) {
    return component;
  }

  return HEADINGS.get(component) ?? component.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function getComponents(labels: string[]) {
  return [...labelValues(labels, 'component'), ...labelValues(labels, 'hook')];
}

function getPart(prefix: string) {
  const part = matchPrefix(prefix, COMPONENT_OF.keys());

  return (part && COMPONENT_OF.get(part)) ?? prefix;
}

function createRouter(changes: ChangelogChange[]) {
  const known = new Set(changes.flatMap(({ labels }) => getComponents(labels)));

  return ({ labels, title }: ChangelogChange) => {
    if (labels.includes(ALL_COMPONENTS_LABEL)) {
      return GENERAL_CHANGES;
    }

    const labeled = getComponents(labels);

    const components =
      labeled.length > 0
        ? labeled
        : parseTitle(title).prefixes.flatMap((prefix) => matchPrefix(getPart(prefix), known) ?? []);

    return components.length > 0 ? components.map(getHeading) : GENERAL_CHANGES;
  };
}

/** Prefix by prefix, and changes without prefixes last. */
function comparePrefixes(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) {
    return b.length - a.length;
  }

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    const order = COLLATOR.compare(a[index].toLowerCase(), b[index].toLowerCase());

    if (order !== 0) {
      return order;
    }
  }

  return a.length - b.length;
}

/** By prefixes, then in the order they were merged. */
function compareChanges(a: ChangelogChange, b: ChangelogChange) {
  return (
    comparePrefixes(parseTitle(a.title).prefixes, parseTitle(b.title).prefixes) ||
    Date.parse(a.mergedAt ?? '') - Date.parse(b.mergedAt ?? '')
  );
}

function renderSections(
  changes: ChangelogChange[],
  level: '##' | '###',
  renderChange: (change: ChangelogChange) => string,
) {
  const groups = groupBy([...changes].sort(compareChanges), createRouter(changes));

  const components = [...groups.keys()]
    .filter((heading) => heading !== GENERAL_CHANGES)
    .sort(COLLATOR.compare);

  return [GENERAL_CHANGES, ...components].map((heading) =>
    section(`${level} ${heading}`, bulletList((groups.get(heading) ?? []).map(renderChange))),
  );
}

function renderText({ isBreakingChange, title }: ChangelogChange) {
  return joinWords(isBreakingChange && BREAKING_CHANGE, parseTitle(title).text);
}

function renderEntry(change: ChangelogChange) {
  const author = formatAuthor(change.author);

  return joinWords(renderText(change), `(${formatReference(change)})`, author && `by ${author}`);
}

function renderDocsEntry(change: ChangelogChange) {
  return joinWords(renderText(change), `([${formatReference(change)}](${change.url}))`);
}

function getCreditedChanges({ changes }: ChangelogData) {
  return changes.filter(
    ({ labels, author, pullRequest }) =>
      !labels.some((label) => EXCLUDED_LABELS.has(label)) &&
      !author?.isBot &&
      !pullRequest?.openedBy?.isBot,
  );
}

function getListedChanges(data: ChangelogData) {
  return getCreditedChanges(data).filter(
    ({ title }) =>
      !parseTitle(title).prefixes.some((prefix) => matchPrefix(prefix, EXCLUDED_PREFIXES)),
  );
}

function renderContributors(data: ChangelogData) {
  const { all } = creditAuthors(getCreditedChanges(data), {
    exclude: Array.from(EXCLUDED_CONTRIBUTORS),
  });

  if (all.length === 0) {
    return '';
  }

  const intro =
    all.length === 1
      ? 'Contributor of this release'
      : 'All contributors of this release in alphabetical order';

  return `${intro}: ${all.map(formatAuthor).join(', ')}`;
}

export function renderChangelog(data: ChangelogData) {
  return joinBlocks(
    `## v${data.version}`,
    formatSubHeader(data),
    renderSections(getListedChanges(data), '###', renderEntry),
    renderContributors(data),
  );
}

/** The page of a release in the docs. */
export function renderDocsPage(data: ChangelogData) {
  const date = formatDate(data.date);

  return joinBlocks(
    `# v${data.version}`,
    `<Subtitle>${date}</Subtitle>\n<Meta name="description" content="v${data.version} release notes. ${date}." />`,
    renderSections(getListedChanges(data), '##', renderDocsEntry),
  );
}
