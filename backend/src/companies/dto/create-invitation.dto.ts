import { IsEmail, IsEnum } from 'class-validator';

import { InvitationRole } from '../entities/invitation.entity';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(InvitationRole)
  role: InvitationRole;
}
