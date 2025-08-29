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
import { InvitationsService } from './invitations.service';
import { InvitationRole } from './entities/invitation.entity';
import { ApiTags } from '@nestjs/swagger';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';

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
  @UseGuards(OptionalJwtAuthGuard)
  @Post(':token/accept')
  async accept(
    @Param('token') token: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: true,
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
