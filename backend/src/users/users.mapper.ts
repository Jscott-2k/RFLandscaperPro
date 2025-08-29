import { User } from './user.entity';
import { UserResponseDto } from './dto/user-response.dto';

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email.toString(),
    role: user.role,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    phone: user.phone ? user.phone.toString() : null,
  };
}
