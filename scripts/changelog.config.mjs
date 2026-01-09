/**
 * @type {import('@mui/internal-code-infra/changelog').ChangelogConfig}
 */
export default {
  format: {
    version: 'v{version}',
    date: 'MMM DD, YYYY',
  },
  contributors: {
    enabled: true,
    message: 'All contributors of this release in alphabetical order: {contributors}',
  },

  filter: {
    // Exclude bot commits
    excludeAuthors: [/\[bot\]$/],

    // Exclude commits with certain labels
    excludeLabels: [
      'internal',
      'dependencies',
      'scope: code-infra',
      'scope: docs-infra',
      'scope: support-infra',
      'test',
      'release',
      'docs',
      'website',
    ],
  },

  categorization: {
    strategy: 'component',

    labels: {
      scope: {
        prefix: 'scope:',
        required: false,
      },
      component: {
        prefix: ['component:', 'hook:'],
        required: true,
      },
      plan: {
        prefix: 'plan:',
        values: ['pro', 'premium'],
      },
      // Category overrides - labels that force a specific section
      categoryOverrides: {
        'scope: all components': 'General changes',
      },
      // Explicit flag labels
      flags: {
        'breaking change': {
          name: 'Breaking Change',
          prefix: '🚨 **Breaking change:** ',
        },
        'type: bug': {
          name: 'Bug Fix',
          prefix: '🐛',
        },
      },
    },

    sections: {
      order: [],
      fallbackSection: 'General changes',
    },
  },

  formatting: {
    messageFormat: 'breaking-inline',

    breakingChange: {
      prefix: '**Breaking change:**',
    },

    prAuthorFormat: 'by @{author}',
  },
};
