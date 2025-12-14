import {
  fetchCommitsBetweenRefs,
  findLatestTaggedVersion,
  type FetchedCommitDetails,
} from '@mui/internal-code-infra/changelog';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import readline from 'node:readline/promises';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startCase } from 'es-toolkit/string';
import packageJson from '../package.json' with { type: 'json' };

const GENERAL_CHANGES_HEADER = 'general changes';

async function main(parameters: CommandParameters) {
  const { lastRelease: previousReleaseParam, release, format } = parameters;

  const latestTaggedVersion = await findLatestTaggedVersion({
    cwd: process.cwd(),
    fetchAll: false,
  });
  const previousRelease =
    previousReleaseParam !== undefined ? previousReleaseParam : latestTaggedVersion;
  if (previousRelease !== latestTaggedVersion) {
    console.warn(
      `Creating changelog for ${previousRelease}..${release} while the latest tagged version is '${latestTaggedVersion}'.`,
    );
  }

  // Temporary code till everyone removes usage of GITHUB_TOKEN
  let octokit: Octokit | undefined;
  if (process.env.GITHUB_TOKEN) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = (
      await rl.question(
        'Found a value in "GITHUB_TOKEN" environment variable.\nIt is not recommended to use it and you should remove it\nfrom your shell rc file (.bashrc/.zshrc etc) if set there.\nDo you still want to use it? (y/N): ',
      )
    )
      .trim()
      .toLowerCase();
    rl.close();
    if (answer === 'y') {
      // eslint-disable-next-line no-console
      console.log('\n\n');
      octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    }
  }

  const commits = await fetchCommitsBetweenRefs({
    lastRelease: previousRelease,
    release,
    repo: 'base-ui',
    octokit,
  });
  const changelogEntries = getChangelogEntries(commits);
  const changesList = getFormattedChangelogEntries(
    changelogEntries.filter((entry) => entry.scope === 'public-api'),
    format,
  );

  const allContributors = getAllContributors(commits);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const changelog = `
## v${packageJson.version}

${format === 'changelog' ? `_${today}_` : `**${today}**`}

${changesList.join('\n')}

${format === 'changelog' ? `All contributors of this release in alphabetical order: ${allContributors}` : ''}
`;

  // eslint-disable-next-line no-console
  console.log(changelog);
}

function getAllContributors(commits: FetchedCommitDetails[]) {
  const authors: string[] = Array.from(
    new Set(
      commits
        .filter((commit) => !!commit.author?.login)
        .map((commit) => {
          return commit.author!.login;
        }),
    ),
  );

  return authors
    .filter((author) => !author.endsWith('[bot]'))
    .sort((a, b) => a.localeCompare(b))
    .map((author) => `@${author}`)
    .join(', ');
}

function getChangelogEntries(commits: FetchedCommitDetails[]): ChangelogEntry[] {
  return commits.map((commit) => {
    const labels = commit.labels;
    return {
      title: cleanCommitMessage(commit.message),
      prNumber: commit.prNumber,
      author: commit.author?.login,
      components: getComponentsFromLabels(labels),
      isBreakingChange: labels.includes('breaking change'),
      scope: getScopeFromLabels(labels),
    } as ChangelogEntry;
  });
}

function getFormattedChangelogEntries(
  changelogEntries: ChangelogEntry[],
  format: 'changelog' | 'docs',
) {
  const changes = new Map<string, { breaking: string[]; nonBreaking: string[] }>();

  for (const entry of changelogEntries) {
    const { title, prNumber, author, components, isBreakingChange } = entry;

    const formattedPrNumber =
      format === 'changelog'
        ? `(#${prNumber})`
        : `([#${prNumber}](https://github.com/mui/base-ui/pull/${prNumber}))`;
    let line: string;
    if (isBreakingChange) {
      line = `- **Breaking change:** ${title}.\n  ${chalk.red('TODO: DESCRIBE THE BREAKING CHANGE.')}\n  ${formattedPrNumber}${format === 'changelog' ? ` by @${author}` : ''}`;
    } else {
      line = `- ${title} ${formattedPrNumber}${format === 'changelog' ? ` by @${author}` : ''}`;
    }

    for (const component of components) {
      if (!changes.has(component)) {
        changes.set(component, { breaking: [], nonBreaking: [] });
      }

      if (isBreakingChange) {
        changes.get(component)?.breaking.push(line);
      } else {
        changes.get(component)?.nonBreaking.push(line);
      }
    }
  }

  const changedComponents = Array.from(changes.keys()).sort((a, b) => {
    if (a === GENERAL_CHANGES_HEADER) {
      return -1;
    }
    if (b === GENERAL_CHANGES_HEADER) {
      return 1;
    }

    return a.localeCompare(b);
  });

  return changedComponents.map((component) => {
    const componentChanges = changes.get(component);
    if (componentChanges === undefined) {
      return '';
    }

    return `${formatHeader(component)}${componentChanges.breaking.join('\n')}${componentChanges.breaking.length > 0 && componentChanges.nonBreaking.length > 0 ? '\n' : ''}${componentChanges.nonBreaking.join('\n')}\n`;
  });
}

function getComponentsFromLabels(labels: string[]): string[] {
  if (labels.includes('all components')) {
    return [GENERAL_CHANGES_HEADER];
  }

  const excludedScopeLabels = ['scope: support-infra', 'scope: code-infra', 'scope: docs-infra'];

  const components = labels
    .filter((label) => {
      return (
        (label.startsWith('component:') ||
          label.startsWith('hook:') ||
          label.startsWith('scope:')) &&
        !excludedScopeLabels.includes(label)
      );
    })
    .map((label) => {
      return label.replace('component: ', '').replace('hook: ', '').replace('scope: ', '');
    });

  return components;
}

function getScopeFromLabels(labels: string[]): ChangeScope {
  if (labels.includes('docs') || labels.includes('website')) {
    return 'docs';
  }

  if (
    labels.includes('scope: support-infra') ||
    labels.includes('scope: code-infra') ||
    labels.includes('scope: docs-infra')
  ) {
    return 'infra';
  }

  if (labels.includes('dependencies')) {
    return 'dependencies';
  }

  if (labels.includes('release')) {
    return 'release';
  }

  if (labels.includes('internal') || labels.includes('test')) {
    return 'internal';
  }

  return 'public-api';
}

function cleanCommitMessage(commitMessage: string) {
  return commitMessage
    .split('\n')[0]
    .replace(/^(\[[A-Za-z0-9 ,]+\])+ /, '') // remove the leading tags
    .replace(/\(#\d+\)/, '') // remove the PR number
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .trim();
}

function formatHeader(section: string): string {
  if (/^use[A-Z]/.test(section)) {
    return `### ${section}\n\n`;
  }

  if (section === GENERAL_CHANGES_HEADER) {
    return `### General changes\n\n`;
  }

  return `### ${startCase(section)}\n\n`;
}

interface CommandParameters {
  lastRelease?: string;
  release: string;
  format: 'changelog' | 'docs';
}

type ChangeScope = 'docs' | 'infra' | 'public-api' | 'internal' | 'dependencies' | 'release';

interface ChangelogEntry {
  title: string;
  prNumber: number;
  author: string;
  components: string[];
  isBreakingChange: boolean;
  scope: ChangeScope;
}

yargs(hideBin(process.argv))
  .command<CommandParameters>(
    '$0',
    'Creates a changelog',
    (command) => {
      return command
        .option('lastRelease', {
          describe:
            'The release to compare against e.g. `v1.0.0-alpha.4`. Default: The latest tag on the current branch.',
          type: 'string',
        })
        .option('release', {
          // #default-branch-switch
          default: 'master',
          describe: 'Ref which we want to release',
          type: 'string',
        })
        .option('format', {
          default: 'changelog',
          describe: 'Format of the generated text. Either "changelog" or "docs"',
          type: 'string',
          choices: ['changelog', 'docs'],
        });
    },
    main,
  )
  .help()
  .strict()
  .version(false)
  .parse();
