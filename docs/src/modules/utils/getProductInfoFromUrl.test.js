import { expect } from 'chai';
import getProductInfoFromUrl from './getProductInfoFromUrl';

describe('getProductInfoFromUrl', () => {
  it('should handle Material UI', () => {
    expect(getProductInfoFromUrl('/material-ui/react-button/')).to.deep.equal({
      productCategoryId: 'core',
      productId: 'material-ui',
    });
    expect(getProductInfoFromUrl('/zh/material-ui/react-button/')).to.deep.equal({
      productCategoryId: 'core',
      productId: 'material-ui',
    });
  });

  it('should ignore anchor', () => {
    expect(
      getProductInfoFromUrl('/material-ui/react-app-bar/#app-bar-with-responsive-menu'),
    ).to.deep.equal({
      productCategoryId: 'core',
      productId: 'material-ui',
    });
  });

  it('should handle Base UI', () => {
    expect(getProductInfoFromUrl('/base-ui/react-button/')).to.deep.equal({
      productCategoryId: 'core',
      productId: 'base-ui',
    });
  });

  it('should handle Joy UI', () => {
    expect(getProductInfoFromUrl('/joy-ui/react-button/')).to.deep.equal({
      productCategoryId: 'core',
      productId: 'joy-ui',
    });
  });

  it('should handle MUI System', () => {
    expect(getProductInfoFromUrl('/system/')).to.deep.equal({
      productCategoryId: 'core',
      productId: 'system',
    });
  });

  it('should handle MUI X Data Drid', () => {
    expect(getProductInfoFromUrl('/x/react-data-grid/components')).to.deep.equal({
      productCategoryId: 'x',
      productId: 'x-data-grid',
    });
  });

  it('should handle MUI X Date Pickers', () => {
    expect(getProductInfoFromUrl('/x/react-date-pickers/components')).to.deep.equal({
      productCategoryId: 'x',
      productId: 'x-date-pickers',
    });
  });

  it('should handle MUI X', () => {
    expect(getProductInfoFromUrl('/x/migration/migration-data-grid-v5/')).to.deep.equal({
      productCategoryId: 'x',
      // Not smart enough to know it's about the data grid.
      // Now, it's a none goal to be able to handle this. Either change the URL to be
      // /x/react-data-grid/migration-v5/
      // or add the productId header to the markdown of this page.
      productId: 'null',
    });
  });

  it('should return x', () => {
    expect(getProductInfoFromUrl('/x/introduction/')).to.deep.equal({
      productCategoryId: 'x',
      productId: 'null',
    });
  });

  it('should return uncategorized', () => {
    expect(getProductInfoFromUrl('/')).to.deep.equal({
      productCategoryId: 'null',
      productId: 'null',
    });
    expect(getProductInfoFromUrl('/#foo')).to.deep.equal({
      productCategoryId: 'null',
      productId: 'null',
    });
    expect(getProductInfoFromUrl('/versions')).to.deep.equal({
      productCategoryId: 'null',
      productId: 'null',
    });
  });

  it('should handle MUI Toolpad', () => {
    expect(getProductInfoFromUrl('/toolpad/getting-started/first-app/')).to.deep.equal({
      productCategoryId: 'null',
      productId: 'toolpad',
    });
  });
});
