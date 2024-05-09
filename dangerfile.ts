// danger has to be the first thing required!
import { danger, markdown } from 'danger';

function addDeployPreviewUrls() {
  const netlifyPreview = `https://deploy-preview-${danger.github.pr.number}--base-ui.netlify.app/`;

  markdown(`
## Netlify deploy preview

${netlifyPreview}
`);
}

async function run() {
  addDeployPreviewUrls();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
