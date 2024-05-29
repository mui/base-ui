import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/table-pagination/table-pagination.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import TablePaginationApiJsonPageContent from '../../api/table-pagination.json';

export default function Page(props) {
  const { userLanguage, ...other } = props;
  return <MarkdownDocs {...pageProps} {...other} />;
}

Page.getLayout = (page) => {
  return <AppFrame>{page}</AppFrame>;
};

export const getStaticPaths = () => {
  return {
    paths: [{ params: { docsTab: 'components-api' } }, { params: { docsTab: 'hooks-api' } }],
    fallback: false, // can also be true or 'blocking'
  };
};

export const getStaticProps = () => {
  const TablePaginationApiReq = require.context(
    'docs-base/translations/api-docs/table-pagination',
    false,
    /\.\/table-pagination.*.json$/,
  );
  const TablePaginationApiDescriptions = mapApiPageTranslations(TablePaginationApiReq);

  return {
    props: {
      componentsApiDescriptions: { TablePagination: TablePaginationApiDescriptions },
      componentsApiPageContents: { TablePagination: TablePaginationApiJsonPageContent },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
