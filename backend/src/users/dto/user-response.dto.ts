import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class UserResponseDto {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  username!: string;
  @ApiProperty({ enum: UserRole })
  role!: UserRole;
  @ApiProperty({ nullable: true })
  passwordResetToken!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  passwordResetExpires!: Date | null;
}
