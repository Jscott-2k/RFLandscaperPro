import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  BadRequestException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { type AuthService } from '../auth/auth.service';
import { Public } from '../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { type AcceptInvitationDto } from './dto/accept-invitation.dto';
import { type InvitationRole } from './entities/invitation.entity';
import { type InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly authService: AuthService,
  ) {}

  @Get(':token')
  async preview(@Param('token') token: string): Promise<{
    companyName: string;
    email: string;
    role: InvitationRole;
    status: 'valid' | 'expired' | 'revoked' | 'accepted';
  }> {
    return this.invitationsService.previewInvitation(token);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post(':token/accept')
  async accept(
    @Param('token') token: string,
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        skipMissingProperties: true,
        whitelist: true,
      }),
    )
    dto: AcceptInvitationDto,
    @Req() req: { user?: { userId: number; email: string } },
  ) {
    if (req.user) {
      const user = await this.invitationsService.acceptExistingUser(
        token,
        req.user,
      );
      return this.authService.login(user);
    }
    if (!dto?.name || !dto?.password) {
      throw new BadRequestException('Name and password are required');
    }
    const user = await this.invitationsService.acceptInvitation(token, dto);
    return this.authService.login(user);
  }
}
