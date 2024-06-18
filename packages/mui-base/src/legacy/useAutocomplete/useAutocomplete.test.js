import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, screen, ErrorBoundary, act, fireEvent } from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { useAutocomplete, createFilterOptions } from '@base_ui/react/legacy/useAutocomplete';

describe('useAutocomplete', () => {
  const { render } = createRenderer();

  it('should preserve DOM nodes of options when re-ordering', () => {
    function Test(props) {
      const { options } = props;
      const {
        groupedOptions,
        getRootProps,
        getInputLabelProps,
        getInputProps,
        getListboxProps,
        getOptionProps,
      } = useAutocomplete({
        options,
        open: true,
      });

      return (
        <div>
          <div {...getRootProps()}>
            <label {...getInputLabelProps()}>useAutocomplete</label>
            <input {...getInputProps()} />
          </div>
          {groupedOptions.length > 0 ? (
            <ul {...getListboxProps()}>
              {groupedOptions.map((option, index) => {
                const { key, ...other } = getOptionProps({ option, index });
                return (
                  <li key={key} {...other}>
                    {option}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      );
    }

    const { rerender } = render(<Test options={['foo', 'bar']} />);
    const [fooOptionAsFirst, barOptionAsSecond] = screen.getAllByRole('option');
    rerender(<Test options={['bar', 'foo']} />);
    const [barOptionAsFirst, fooOptionAsSecond] = screen.getAllByRole('option');

    // If the DOM nodes are not preserved VO will not read the first option again since it thinks it didn't change.
    expect(fooOptionAsFirst).to.equal(fooOptionAsSecond);
    expect(barOptionAsFirst).to.equal(barOptionAsSecond);
  });

  describe('createFilterOptions', () => {
    it('defaults to getOptionLabel for text filtering', () => {
      const filterOptions = createFilterOptions();

      const getOptionLabel = (option) => option.name;
      const options = [
        {
          id: '1234',
          name: 'cat',
        },
        {
          id: '5678',
          name: 'dog',
        },
        {
          id: '9abc',
          name: 'emu',
        },
      ];

      expect(filterOptions(options, { inputValue: 'a', getOptionLabel })).to.deep.equal([
        options[0],
      ]);
    });

    it('filters without error with empty option set', () => {
      const filterOptions = createFilterOptions();

      const getOptionLabel = (option) => option.name;
      const options = [];

      expect(filterOptions(options, { inputValue: 'a', getOptionLabel })).to.deep.equal([]);
    });

    describe('option: limit', () => {
      it('limits the number of suggested options to be shown', () => {
        const filterOptions = createFilterOptions({ limit: 2 });

        const getOptionLabel = (option) => option.name;
        const options = [
          {
            id: '1234',
            name: 'a1',
          },
          {
            id: '5678',
            name: 'a2',
          },
          {
            id: '9abc',
            name: 'a3',
          },
          {
            id: '9abc',
            name: 'a4',
          },
        ];

        expect(filterOptions(options, { inputValue: 'a', getOptionLabel })).to.deep.equal([
          options[0],
          options[1],
        ]);
      });
    });

    describe('option: matchFrom', () => {
      let filterOptions;
      let getOptionLabel;
      let options;

      beforeEach(() => {
        filterOptions = createFilterOptions({ matchFrom: 'any' });
        getOptionLabel = (option) => option.name;
        options = [
          {
            id: '1234',
            name: 'ab',
          },
          {
            id: '5678',
            name: 'ba',
          },
          {
            id: '9abc',
            name: 'ca',
          },
        ];
      });

      describe('any', () => {
        it('show all results that match', () => {
          expect(filterOptions(options, { inputValue: 'a', getOptionLabel })).to.deep.equal(
            options,
          );
        });
      });

      describe('empty', () => {
        it('does not call getOptionLabel if filter is empty', () => {
          const getOptionLabelSpy = spy(getOptionLabel);
          expect(
            filterOptions(options, { inputValue: '', getOptionLabel: getOptionLabelSpy }),
          ).to.deep.equal(options);
          expect(getOptionLabelSpy.callCount).to.equal(0);
        });
      });

      describe('start', () => {
        it('show only results that start with search', () => {
          expect(filterOptions(options, { inputValue: 'a', getOptionLabel })).to.deep.equal(
            options,
          );
        });
      });
    });

    describe('option: ignoreAccents', () => {
      it('does not ignore accents', () => {
        const filterOptions = createFilterOptions({ ignoreAccents: false });

        const getOptionLabel = (option) => option.name;
        const options = [
          {
            id: '1234',
            name: 'áb',
          },
          {
            id: '5678',
            name: 'ab',
          },
          {
            id: '9abc',
            name: 'áe',
          },
          {
            id: '9abc',
            name: 'ae',
          },
        ];

        expect(filterOptions(options, { inputValue: 'á', getOptionLabel })).to.deep.equal([
          options[0],
          options[2],
        ]);
      });
    });

    describe('option: ignoreCase', () => {
      it('matches results with case insensitive', () => {
        const filterOptions = createFilterOptions({ ignoreCase: false });

        const getOptionLabel = (option) => option.name;
        const options = [
          {
            id: '1234',
            name: 'Ab',
          },
          {
            id: '5678',
            name: 'ab',
          },
          {
            id: '9abc',
            name: 'Ae',
          },
          {
            id: '9abc',
            name: 'ae',
          },
        ];

        expect(filterOptions(options, { inputValue: 'A', getOptionLabel })).to.deep.equal([
          options[0],
          options[2],
        ]);
      });
    });
  });

  it('should warn if the input is not binded', function test() {
    // TODO is this fixed?
    if (!/jsdom/.test(window.navigator.userAgent)) {
      // can't catch render errors in the browser for unknown reason
      // tried try-catch + error boundary + window onError preventDefault
      this.skip();
    }

    function Test(props) {
      const { options } = props;
      const {
        groupedOptions,
        getRootProps,
        getInputLabelProps,
        // getInputProps,
        getListboxProps,
        getOptionProps,
      } = useAutocomplete({
        options,
        open: true,
      });

      return (
        <div>
          <div {...getRootProps()}>
            <label {...getInputLabelProps()}>useAutocomplete</label>
          </div>
          {groupedOptions.length > 0 ? (
            <ul {...getListboxProps()}>
              {groupedOptions.map((option, index) => {
                const { key, ...other } = getOptionProps({ option, index });
                return (
                  <li key={key} {...other}>
                    {option}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      );
    }

    const node16ErrorMessage =
      "TypeError: Cannot read properties of null (reading 'removeAttribute')";
    const olderNodeErrorMessage = "TypeError: Cannot read property 'removeAttribute' of null";

    const nodeVersion = Number(process.versions.node.split('.')[0]);
    const errorMessage = nodeVersion >= 16 ? node16ErrorMessage : olderNodeErrorMessage;

    const wrappedErrorMessage = `Error: Uncaught [${errorMessage}]`;

    const react17ErrorMessages = [
      wrappedErrorMessage,
      'MUI: Unable to find the input element.',
      wrappedErrorMessage,
      'The above error occurred in the <ul> component',
      'The above error occurred in the <Test> component',
    ];

    const react182ErrorMessages = [
      wrappedErrorMessage,
      'MUI: Unable to find the input element.',
      wrappedErrorMessage,
      // strict effects runs effects twice
      'MUI: Unable to find the input element.',
      wrappedErrorMessage,
      'The above error occurred in the <ul> component',
      'The above error occurred in the <Test> component',
      // strict effects runs effects twice
      'The above error occurred in the <Test> component',
    ];

    const react183ErrorMessages = [
      'MUI: Unable to find the input element.',
      'MUI: Unable to find the input element.',
      errorMessage,
      errorMessage,
      errorMessage,
    ];

    let devErrorMessages;
    if (React.version.startsWith('18.3')) {
      devErrorMessages = react183ErrorMessages;
    } else if (React.version.startsWith('18')) {
      devErrorMessages = react182ErrorMessages;
    } else {
      devErrorMessages = react17ErrorMessages;
    }

    expect(() => {
      render(
        <ErrorBoundary>
          <Test options={['foo', 'bar']} />
        </ErrorBoundary>,
      );
    }).toErrorDev(devErrorMessages);
  });

  describe('prop: freeSolo', () => {
    it('should not reset if the component value does not change on blur', () => {
      function Test(props) {
        const { options } = props;
        const { getInputProps } = useAutocomplete({ options, open: true, freeSolo: true });

        return <input {...getInputProps()} />;
      }
      render(<Test options={['foo', 'bar']} />);
      const input = screen.getByRole('combobox');

      act(() => {
        fireEvent.change(input, { target: { value: 'free' } });
        input.blur();
      });

      expect(input.value).to.equal('free');
    });
  });

  describe('getInputProps', () => {
    it('should disable input element', () => {
      function Test(props) {
        const { options } = props;
        const { getInputProps } = useAutocomplete({ options, disabled: true });

        return <input {...getInputProps()} />;
      }
      render(<Test options={['foo', 'bar']} />);
      const input = screen.getByRole('combobox');

      expect(input).to.have.attribute('disabled');
    });
  });

  it('should allow tuples or arrays as value when multiple=false', () => {
    const defaultValue = ['bar'];
    function Test() {
      const { getClearProps, getInputProps } = useAutocomplete({
        defaultValue,
        disableClearable: false,
        getOptionLabel: ([val]) => val,
        isOptionEqualToValue: (option, value) => {
          if (option === value) {
            return true;
          }
          return option[0] === value[0];
        },
        multiple: false,
        options: [['foo'], defaultValue, ['baz']],
      });

      return (
        <div>
          <input {...getInputProps()} />
          <button data-testid="button" {...getClearProps()} />;
        </div>
      );
    }

    const { getByTestId } = render(<Test />);

    const button = getByTestId('button');

    expect(() => {
      fireEvent.click(button);
    }).not.to.throw();
  });
});
