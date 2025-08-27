import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class UserResponseDto {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  username!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty({ enum: UserRole })
  role!: UserRole;
  @ApiProperty({ nullable: true })
  firstName!: string | null;
  @ApiProperty({ nullable: true })
  lastName!: string | null;
  @ApiProperty({ nullable: true })
  phone!: string | null;
}
