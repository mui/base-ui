const fs = require('fs');
const path = require('path');

// Read the old releases page
const releasesPath = path.join(__dirname, '../app/(docs)/react/overview/releases/page-old.mdx');
const releasesContent = fs.readFileSync(releasesPath, 'utf8');

// Split by version headings
const versionRegex = /^## (v[\d.-]+(?:alpha|beta|rc)?\.?\d*)$/gm;
const matches = [];
let match;

while ((match = versionRegex.exec(releasesContent)) !== null) {
  matches.push({
    version: match[1],
    index: match.index,
  });
}

// Extract content for each version
for (let i = 0; i < matches.length; i++) {
  const current = matches[i];
  const next = matches[i + 1];
  
  const startIndex = current.index;
  const endIndex = next ? next.index : releasesContent.length;
  
  let content = releasesContent.substring(startIndex, endIndex).trim();
  
  // Convert version to slug (e.g., v1.0.0-alpha.7 -> v1-0-0-alpha-7)
  const versionSlug = current.version
    .replace(/\./g, '-')
    .toLowerCase();
  
  // Create directory for this version
  const versionDir = path.join(__dirname, '../app/(docs)/react/overview/releases', versionSlug);
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }
  
  // Remove the heading level (make ## into #)
  content = content.replace(/^## /, '# ');
  
  // Write the MDX file
  const mdxPath = path.join(versionDir, 'page.mdx');
  fs.writeFileSync(mdxPath, content);
  
  console.log(`Created ${versionSlug}/page.mdx`);
}

console.log('Done!');
