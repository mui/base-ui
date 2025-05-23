import type * as dangerModule from 'danger';
import { renderMarkdownReport } from '@mui/internal-bundle-size-checker';

declare const danger: (typeof dangerModule)['danger'];
declare const markdown: (typeof dangerModule)['markdown'];

const circleCIBuildNumber = process.env.CIRCLE_BUILD_NUM;
const circleCIBuildUrl = `https://app.circleci.com/pipelines/github/mui/base-ui/jobs/${circleCIBuildNumber}`;
const dangerCommand = process.env.DANGER_COMMAND;

function prepareBundleSizeReport() {
  markdown(
    `## Bundle size report

Bundle size will be reported once [CircleCI build #${circleCIBuildNumber}](${circleCIBuildUrl}) finishes.`,
  );
}

// These functions are no longer needed as they've been moved to the prSizeDiff.js module

async function reportBundleSize() {
  let markdownContent = `## Bundle size report\n\n`;

  if (!process.env.CIRCLE_BUILD_NUM) {
    throw new Error('CIRCLE_BUILD_NUM is not defined');
  }

  const circleciBuildNumber = process.env.CIRCLE_BUILD_NUM;

  markdownContent += await renderMarkdownReport(danger.github.pr, circleciBuildNumber);

  // Use the markdown function to publish the report
  markdown(markdownContent);
}

async function run() {
  switch (dangerCommand) {
    case 'prepareBundleSizeReport':
      prepareBundleSizeReport();
      break;
    case 'reportBundleSize':
      await reportBundleSize();
      break;
    default:
      throw new TypeError(`Unrecognized danger command '${dangerCommand}'`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
