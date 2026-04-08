import { describe, expect, it } from 'vitest';
import { normalizeOTPValue, removeOTPCharacter, replaceOTPValue, stripOTPWhitespace } from './otp';

describe('otp utils', () => {
  it('removes whitespace from pasted values', () => {
    expect(stripOTPWhitespace(' 12 3\t4\n5 ')).toBe('12345');
  });

  it('normalizes, filters, and clamps numeric values', () => {
    expect(normalizeOTPValue('1a 2b34c56', 4, 'numeric')).toBe('1234');
  });

  it('uses custom sanitization when validationType is none', () => {
    expect(
      normalizeOTPValue('ab-12 cd', 6, 'none', (value) =>
        value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
      ),
    ).toBe('AB12CD');
  });

  it('returns an empty string for negative lengths', () => {
    expect(normalizeOTPValue('1234', -1, 'none')).toBe('');
  });

  it('replaces values from the middle of the OTP', () => {
    expect(replaceOTPValue('123456', 2, '99', 6, 'numeric')).toBe('129956');
  });

  it('leaves the value unchanged when removing an out-of-bounds index', () => {
    expect(removeOTPCharacter('1234', 10)).toBe('1234');
  });
});
