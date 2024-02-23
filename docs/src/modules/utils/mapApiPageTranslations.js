import { createRender } from '@mui/internal-markdown';
import { LANGUAGES_IGNORE_PAGES } from '../../../config';

const notEnglishJsonRegExp = /-([a-z]{2})\.json$/;

export default function mapApiPageTranslations(req) {
  const headingHashes = {};
  const translations = {};

  // Process the English markdown before the other locales.
  // English ToC anchor links are used in all languages
  let filenames = [];
  req.keys().forEach((filename) => {
    if (filename.match(notEnglishJsonRegExp)) {
      filenames.push(filename);
    } else {
      filenames = [filename].concat(filenames);
    }
  });

  filenames.forEach((filename) => {
    const matchNotEnglishMarkdown = filename.match(notEnglishJsonRegExp);
    const userLanguage = matchNotEnglishMarkdown !== null ? matchNotEnglishMarkdown[1] : 'en';
    const translation = req(filename) || null;

    if (translation !== null && translation.componentDescription) {
      const componentDescriptionToc = [];
      const render = createRender({
        headingHashes,
        toc: componentDescriptionToc,
        userLanguage,
        location: filenames,
        options: {
          ignoreLanguagePages: LANGUAGES_IGNORE_PAGES,
          env: {
            SOURCE_CODE_REPO: '',
          },
        },
      });
      translation.componentDescription = render(translation.componentDescription);
      translation.componentDescriptionToc = componentDescriptionToc;
    }

    translations[userLanguage] = translation;
  });

  return translations;
}
