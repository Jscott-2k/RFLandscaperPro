import { BadRequestException } from '@nestjs/common';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new BadRequestException(
      'Password must be at least 8 characters long',
    );
  }
  if (!/(?=.*[a-z])/.test(password)) {
    throw new BadRequestException(
      'Password must contain at least one lowercase letter',
    );
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    throw new BadRequestException(
      'Password must contain at least one uppercase letter',
    );
  }
  if (!/(?=.*\d)/.test(password)) {
    throw new BadRequestException('Password must contain at least one number');
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    throw new BadRequestException(
      'Password must contain at least one special character (@$!%*?&)',
    );
  }
}
