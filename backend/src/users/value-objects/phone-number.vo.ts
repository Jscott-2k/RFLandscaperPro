export class PhoneNumber {
  private readonly _value: string;

  constructor(value: string) {
    const digits = value.replace(/[^\d+]/g, '');
    const normalized = digits.startsWith('+') ? digits : `+${digits}`;
    if (!/^\+?\d{10,15}$/.test(normalized)) {
      throw new Error('Invalid phone number');
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
