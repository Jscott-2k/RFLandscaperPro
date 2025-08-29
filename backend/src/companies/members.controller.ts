import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/user.entity';
import { AuthUser } from '../common/decorators/auth-user.decorator';
import { MembersService } from './members.service';
import { CompanyMemberResponseDto } from './dto/company-member-response.dto';
import { UpdateCompanyMemberDto } from './dto/update-company-member.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Roles(UserRole.Owner, UserRole.Admin)
@Controller('companies/:companyId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async list(
    @Param('companyId', ParseIntPipe) companyId: number,
    @AuthUser() user: User | undefined,
  ): Promise<CompanyMemberResponseDto[]> {
    if (user!.companyId !== companyId)
      throw new NotFoundException('Company not found');
    return this.membersService.findMembers(companyId);
  }

  @Patch(':userId')
  async update(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateCompanyMemberDto,
    @AuthUser() user: User | undefined,
  ): Promise<CompanyMemberResponseDto> {
    if (user!.companyId !== companyId)
      throw new NotFoundException('Company not found');
    return this.membersService.updateMember(companyId, userId, dto);
  }

  @Delete(':userId')
  async remove(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @AuthUser() user: User | undefined,
  ): Promise<void> {
    if (user!.companyId !== companyId)
      throw new NotFoundException('Company not found');
    await this.membersService.removeMember(companyId, userId);
  }
}
