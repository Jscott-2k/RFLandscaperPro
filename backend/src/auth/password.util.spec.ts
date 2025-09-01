import { BadRequestException } from '@nestjs/common';

import { PASSWORD_REGEX, validatePasswordStrength } from './password.util';

import 'reflect-metadata';

describe('PASSWORD_REGEX', () => {
  it('accepts a valid password', () => {
    expect(PASSWORD_REGEX.test('Password1!')).toBe(true);
  });

  it('rejects a password missing lowercase', () => {
    expect(PASSWORD_REGEX.test('PASSWORD1!')).toBe(false);
  });

  it('rejects a password missing uppercase', () => {
    expect(PASSWORD_REGEX.test('password1!')).toBe(false);
  });

  it('rejects a password missing number', () => {
    expect(PASSWORD_REGEX.test('Password!')).toBe(false);
  });

  it('rejects a password missing special character', () => {
    expect(PASSWORD_REGEX.test('Password1')).toBe(false);
  });
});

describe('validatePasswordStrength', () => {
  it('accepts a strong password', () => {
    expect(() => validatePasswordStrength('Password1!')).not.toThrow();
  });

  it('rejects a short password', () => {
    expect(() => validatePasswordStrength('Pass1!')).toThrow(
      new BadRequestException('Password must be at least 8 characters long'),
    );
  });

  it('rejects missing lowercase', () => {
    expect(() => validatePasswordStrength('PASSWORD1!')).toThrow(
      new BadRequestException('Password must contain at least one lowercase letter'),
    );
  });

  it('rejects missing uppercase', () => {
    expect(() => validatePasswordStrength('password1!')).toThrow(
      new BadRequestException('Password must contain at least one uppercase letter'),
    );
  });

  it('rejects missing number', () => {
    expect(() => validatePasswordStrength('Password!')).toThrow(
      new BadRequestException('Password must contain at least one number'),
    );
  });

  it('rejects missing special character', () => {
    expect(() => validatePasswordStrength('Password1')).toThrow(
      new BadRequestException(
        'Password must contain at least one special character (@$!%*?&)',
      ),
    );
  });
});

