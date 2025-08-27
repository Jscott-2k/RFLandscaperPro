import { User } from './user.entity';
import { UserResponseDto } from './dto/user-response.dto';

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    passwordResetToken: user.passwordResetToken ?? null,
    passwordResetExpires: user.passwordResetExpires ?? null,
  };
}
