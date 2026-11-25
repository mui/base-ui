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

/**
 * @typedef {import('@mui/internal-code-infra/changelog').ChangelogChange} ChangelogChange
 * @typedef {import('@mui/internal-code-infra/changelog').ChangelogData} ChangelogData
 */

const GENERAL_CHANGES = 'General changes';
const BREAKING_CHANGE = '🚨 **Breaking change:**';
const ALL_COMPONENTS_LABEL = 'scope: all components';
const BOT_SUFFIX = '[bot]';

const EXCLUDED_LABELS = [
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
];

const EXCLUDED_PREFIXES = ['utils', 'internals', 'example', 'examples', 'experiments'];
const EXCLUDED_CONTRIBUTORS = ['Copilot'];

/** Title prefixes of parts that have no section of their own. */
const COMPONENT_OF = new Map([['radio', 'radio group']]);
const HEADINGS = new Map([['otp field', 'OTP Field']]);

// Pinned, so that the order doesn't depend on the locale of the machine.
const COLLATOR = new Intl.Collator('en');
const SORTED_LAST = '\uFFFF';

/**
 * @param {string} component
 */
function getHeading(component) {
  if (component !== component.toLowerCase()) {
    return component;
  }

  return HEADINGS.get(component) ?? component.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

/**
 * @param {string[]} labels
 */
function getComponents(labels) {
  return [...labelValues(labels, 'component'), ...labelValues(labels, 'hook')];
}

/**
 * @param {ChangelogChange[]} changes
 */
function createRouter(changes) {
  const known = new Set(changes.flatMap(({ labels }) => getComponents(labels)));

  return (/** @type {ChangelogChange} */ { labels, title }) => {
    if (labels.includes(ALL_COMPONENTS_LABEL)) {
      return GENERAL_CHANGES;
    }

    const labeled = getComponents(labels);

    const components =
      labeled.length > 0
        ? labeled
        : parseTitle(title).prefixes.flatMap(
            (prefix) => matchPrefix(COMPONENT_OF.get(prefix) ?? prefix, known) ?? [],
          );

    return components.length > 0 ? components.map(getHeading) : GENERAL_CHANGES;
  };
}

/**
 * @param {ChangelogChange} change
 */
function getSortKey({ title }) {
  const { prefixes } = parseTitle(title);

  return prefixes.length > 0 ? prefixes.join('\0').toLowerCase() : SORTED_LAST;
}

/**
 * By prefixes, then in the order they were merged.
 *
 * @param {ChangelogChange} a
 * @param {ChangelogChange} b
 */
function compareChanges(a, b) {
  return (
    COLLATOR.compare(getSortKey(a), getSortKey(b)) ||
    Date.parse(a.mergedAt ?? '') - Date.parse(b.mergedAt ?? '')
  );
}

/**
 * @param {ChangelogChange[]} changes
 * @param {string} level - Of the headings
 * @param {(change: ChangelogChange) => string} formatChange
 */
function formatSections(changes, level, formatChange) {
  const groups = groupBy([...changes].sort(compareChanges), createRouter(changes));

  const components = [...groups.keys()]
    .filter((heading) => heading !== GENERAL_CHANGES)
    .sort(COLLATOR.compare);

  return [GENERAL_CHANGES, ...components].map((heading) =>
    section(`${level} ${heading}`, bulletList((groups.get(heading) ?? []).map(formatChange))),
  );
}

/**
 * @param {ChangelogChange} change
 */
function formatText({ isBreakingChange, title }) {
  return joinWords(isBreakingChange && BREAKING_CHANGE, parseTitle(title).text);
}

/**
 * @param {ChangelogChange} change
 */
function formatEntry(change) {
  const author = formatAuthor(change.author);

  return joinWords(formatText(change), `(${formatReference(change)})`, author && `by ${author}`);
}

/**
 * @param {ChangelogChange} change
 */
function formatDocsEntry(change) {
  return joinWords(formatText(change), `([${formatReference(change)}](${change.url}))`);
}

/**
 * @param {ChangelogData} data
 */
function getCreditedChanges({ changes }) {
  return changes.filter(
    ({ labels, author }) =>
      !labels.some((label) => EXCLUDED_LABELS.includes(label)) &&
      !author?.login?.endsWith(BOT_SUFFIX),
  );
}

/**
 * @param {ChangelogData} data
 */
function getListedChanges(data) {
  return getCreditedChanges(data).filter(
    ({ title }) => !EXCLUDED_PREFIXES.includes(parseTitle(title).prefixes[0]),
  );
}

/**
 * @param {ChangelogData} data
 */
function formatContributors(data) {
  const { all } = creditAuthors(getCreditedChanges(data), { exclude: EXCLUDED_CONTRIBUTORS });

  if (all.length === 0) {
    return '';
  }

  const intro =
    all.length === 1
      ? 'Contributor of this release'
      : 'All contributors of this release in alphabetical order';

  return `${intro}: ${all.map(formatAuthor).join(', ')}`;
}

/**
 * @param {ChangelogData} data
 */
export function formatChangelog(data) {
  return joinBlocks(
    `## v${data.version}`,
    formatSubHeader(data),
    formatSections(getListedChanges(data), '###', formatEntry),
    formatContributors(data),
  );
}

/**
 * The page of a release in the docs.
 *
 * @param {ChangelogData} data
 */
export function formatDocsPage(data) {
  const date = formatDate(data.date);

  return joinBlocks(
    `# v${data.version}`,
    `<Subtitle>${date}</Subtitle>\n<Meta name="description" content="v${data.version} release notes. ${date}." />`,
    formatSections(getListedChanges(data), '##', formatDocsEntry),
  );
}
