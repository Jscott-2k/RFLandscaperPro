import { Controller, Get, Param } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationRole } from './entities/invitation.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':token')
  async preview(
    @Param('token') token: string,
  ): Promise<{
    companyName: string;
    email: string;
    role: InvitationRole;
    status: 'valid' | 'expired' | 'revoked' | 'accepted';
  }> {
    return this.invitationsService.previewInvitation(token);
  }
}
