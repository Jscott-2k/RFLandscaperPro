import { IsString, MinLength, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '../../auth/password.util';

export class AcceptInvitationDto {
  @IsString()
  name: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}
