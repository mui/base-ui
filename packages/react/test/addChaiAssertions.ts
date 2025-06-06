import chai from 'chai';

// https://stackoverflow.com/a/46755166/3406963
declare global {
  namespace Chai {
    interface Assertion {
      /**
       * Matcher with useful error messages if the dates don't match.
       */
      toEqualDateTime(expected: any): void;
    }
  }
}

chai.use((chaiAPI, utils) => {
  chaiAPI.Assertion.addMethod('toEqualDateTime', function toEqualDateTime(expectedDate, message) {
    // eslint-disable-next-line no-underscore-dangle
    const actualDate = this._obj;

    // Luxon dates don't have a `toISOString` function, we need to convert to the JS date first
    const cleanActualDate =
      typeof actualDate.toJSDate === 'function' ? actualDate.toJSDate() : actualDate;

    let cleanExpectedDate;
    if (typeof expectedDate === 'string') {
      cleanExpectedDate = new Date(expectedDate);
    } else if (typeof expectedDate.toJSDate === 'function') {
      cleanExpectedDate = expectedDate.toJSDate();
    } else {
      cleanExpectedDate = expectedDate;
    }

    const assertion = new chaiAPI.Assertion(cleanActualDate.toISOString(), message);
    // TODO: Investigate if `as any` can be removed after https://github.com/DefinitelyTyped/DefinitelyTyped/issues/48634 is resolved.
    utils.transferFlags(this as any, assertion, false);
    assertion.to.equal(cleanExpectedDate.toISOString());
  });
});

export type {};
