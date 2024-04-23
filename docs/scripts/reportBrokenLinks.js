/* eslint-disable no-console */
const path = require('path');
const fse = require('fs-extra');
const { parseDocFolder, getAnchor } = require('@mui/monorepo/docs/scripts/reportBrokenLinks');

const docsSpaceRoot = path.join(__dirname, '../');

function save(lines) {
  const fileContents = [...lines, ''].join('\n');
  fse.writeFileSync(path.join(docsSpaceRoot, '.link-check-errors.txt'), fileContents);
}

const UNSUPPORTED_PATHS = ['/careers/', '/store/', '/x/'];

const buffer = [];

function write(text) {
  buffer.push(text);
}

// {[url with hash]: true}
const availableBaseUILinks = {};
const availableLinksCore = {};

// {[url with hash]: list of files using this link}
const usedBaseUILinks = {};
const usedLinksCore = {};

parseDocFolder(path.join(docsSpaceRoot, './pages/'), availableBaseUILinks, usedBaseUILinks, '');
parseDocFolder(
  path.resolve(__dirname, '../../node_modules/@mui/monorepo/docs/pages/'),
  availableLinksCore,
  usedLinksCore,
  '',
);

function removeApiLinkHash(link) {
  // Determine if the link is an API path
  // for example /x/api/data-grid/, /material-ui/api/button/, /system/api/box/
  const isApiPath = link.match(/^\/[\w-]+\/api\//);
  if (!isApiPath) {
    return link;
  }
  const [rep] = link.split('/#');
  // if the link actually includes a hash, we need to re-add the necessary `/` at the end
  return link.includes('/#') ? `${rep}/` : rep;
}

const usedLinks = { ...usedLinksCore, ...usedBaseUILinks };
const availableLinks = { ...availableLinksCore, ...availableBaseUILinks };

write('Broken links found by `pnpm docs:link-check` that exist:\n');
Object.keys(usedLinks)
  .filter((link) => link.startsWith('/'))
  .filter((link) => !availableLinks[removeApiLinkHash(link)])
  // these url segments are specific to Base UI and added by scripts (can not be found in markdown)
  .filter((link) =>
    ['components-api', 'hooks-api', '#unstyled'].every((str) => !link.includes(str)),
  )
  .filter((link) => UNSUPPORTED_PATHS.every((unsupportedPath) => !link.includes(unsupportedPath)))
  .sort()
  .forEach((linkKey) => {
    write(`- https://mui.com${linkKey}`);
    console.log(`https://mui.com${linkKey}`);
    console.log(`used in`);
    usedLinks[linkKey].forEach((f) => console.log(`- ${path.relative(docsSpaceRoot, f)}`));
    console.log('available anchors on the same page:');
    console.log(
      Object.keys(availableLinks)
        .filter((link) => removeApiLinkHash(link) === removeApiLinkHash(linkKey))
        .sort()
        .map(getAnchor)
        .join('\n'),
    );
    console.log('\n\n');
  });

save(buffer);
