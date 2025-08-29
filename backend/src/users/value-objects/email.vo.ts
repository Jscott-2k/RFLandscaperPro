import { isEmail } from 'class-validator';

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!isEmail(normalized)) {
      throw new Error('Invalid email address');
    }
    this._value = normalized;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
