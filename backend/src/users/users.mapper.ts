import { type UserResponseDto } from './dto/user-response.dto';
import { type User } from './user.entity';

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    email: user.email.toString(),
    firstName: user.firstName ?? null,
    id: user.id,
    lastName: user.lastName ?? null,
    phone: user.phone ? user.phone.toString() : null,
    role: user.role,
    username: user.username,
  };
}
