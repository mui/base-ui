import { expect } from 'chai';
import { FieldReducerAction } from './FormField.types';
import { FieldActionTypes } from './fieldAction.types';
import { fieldReducer } from './fieldReducer';

const initialState = {
  value: null,
  dirty: false,
  disabled: false,
  focused: false,
  invalid: false,
  touched: false,
  error: null,
};

describe('fieldReducer', () => {
  describe('action: touch', () => {
    it('sets the touched state to true', () => {
      const action: FieldReducerAction = {
        type: FieldActionTypes.touch,
      };

      const result = fieldReducer(initialState, action);

      expect(result.touched).to.equal(true);
    });
  });

  describe('action: untouch', () => {
    it('sets the touched state to false', () => {
      const action: FieldReducerAction = {
        type: FieldActionTypes.untouch,
      };

      const result = fieldReducer(initialState, action);

      expect(result.touched).to.equal(false);
    });
  });

  describe('action: focus', () => {
    it('sets the focused state and touched state to true', () => {
      const action: FieldReducerAction = {
        type: FieldActionTypes.focus,
      };

      const result = fieldReducer(initialState, action);

      expect(result.focused).to.equal(true);
      expect(result.touched).to.equal(true);
    });
  });

  describe('action: blur', () => {
    it('sets the focused state to false without changing the dirty state', () => {
      const state = {
        ...initialState,
        focused: true,
        touched: true,
      };

      const action: FieldReducerAction = {
        type: FieldActionTypes.blur,
      };

      const result = fieldReducer(state, action);

      expect(result.focused).to.equal(false);
      expect(result.touched).to.equal(true);
    });
  });

  describe('action: changeValue', () => {
    it('updates the value', () => {
      const action: FieldReducerAction = {
        type: FieldActionTypes.changeValue,
        value: 'Hello world',
      };

      const result = fieldReducer(initialState, action);

      expect(result.value).to.equal('Hello world');
    });
  });

  describe('action: setError', () => {
    it('sets the invalid state without extra error details', () => {
      const action: FieldReducerAction = {
        type: FieldActionTypes.setError,
      };

      const result = fieldReducer(initialState, action);

      expect(result.invalid).to.equal(true);
      expect(result.error).to.equal(null);
    });

    it('sets the invalid state with error message', () => {
      const action: FieldReducerAction = {
        type: FieldActionTypes.setError,
        error: 'Username already taken',
      };

      const result = fieldReducer(initialState, action);

      expect(result.invalid).to.equal(true);
      expect(result.error).to.equal('Username already taken');
    });

    it('sets the invalid state with arbitrary error object', () => {
      const error = {
        type: 'auth',
        code: 'A002',
        message: 'Username already taken',
      };
      const action: FieldReducerAction = {
        type: FieldActionTypes.setError,
        error,
      };

      const result = fieldReducer(initialState, action);

      expect(result.invalid).to.equal(true);
      expect(result.error).to.deep.equal(error);
    });
  });

  describe('action: clearError', () => {
    it('clears the invalid state and error', () => {
      const action: FieldReducerAction = {
        type: FieldActionTypes.clearError,
      };

      const result = fieldReducer(initialState, action);

      expect(result.invalid).to.equal(false);
      expect(result.error).to.equal(null);
    });
  });
});
