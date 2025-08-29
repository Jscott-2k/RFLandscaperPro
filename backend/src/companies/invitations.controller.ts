import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationRole } from './entities/invitation.entity';
import { ApiTags } from '@nestjs/swagger';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly authService: AuthService,
  ) {}

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

  @Public()
  @Post(':token/accept')
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptInvitationDto,
  ) {
    const user = await this.invitationsService.acceptInvitation(token, dto);
    return this.authService.login(user);
  }
}
