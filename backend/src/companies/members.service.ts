import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { type CompanyMemberResponseDto } from './dto/company-member-response.dto';
import { type UpdateCompanyMemberDto } from './dto/update-company-member.dto';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from './entities/company-user.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(CompanyUser)
    private readonly companyUsersRepository: Repository<CompanyUser>,
  ) {}

  async findMembers(companyId: number): Promise<CompanyMemberResponseDto[]> {
    const members = await this.companyUsersRepository.find({
      relations: ['user'],
      where: { companyId },
    });
    return members.map((m) => this.toResponseDto(m));
  }

  async updateMember(
    companyId: number,
    userId: number,
    dto: UpdateCompanyMemberDto,
  ): Promise<CompanyMemberResponseDto> {
    const membership = await this.companyUsersRepository.findOne({
      relations: ['user'],
      where: { companyId, userId },
    });
    if (!membership) {throw new NotFoundException('Member not found');}

    if (membership.role === CompanyUserRole.OWNER) {
      const ownerCount = await this.companyUsersRepository.count({
        where: {
          companyId,
          role: CompanyUserRole.OWNER,
          status: CompanyUserStatus.ACTIVE,
        },
      });
      if (
        ownerCount === 1 &&
        ((dto.role && dto.role !== CompanyUserRole.OWNER) ||
          (dto.status && dto.status !== CompanyUserStatus.ACTIVE))
      ) {
        throw new BadRequestException('Cannot demote the last owner');
      }
    }

    if (dto.role) {membership.role = dto.role;}
    if (dto.status) {membership.status = dto.status;}
    const saved = await this.companyUsersRepository.save(membership);
    return this.toResponseDto(saved);
  }

  async removeMember(companyId: number, userId: number): Promise<void> {
    const membership = await this.companyUsersRepository.findOne({
      where: { companyId, userId },
    });
    if (!membership) {throw new NotFoundException('Member not found');}
    if (membership.role === CompanyUserRole.OWNER) {
      const ownerCount = await this.companyUsersRepository.count({
        where: {
          companyId,
          role: CompanyUserRole.OWNER,
          status: CompanyUserStatus.ACTIVE,
        },
      });
      if (ownerCount === 1)
        {throw new BadRequestException('Cannot remove the last owner');}
    }
    await this.companyUsersRepository.delete({ companyId, userId });
  }

  private toResponseDto(m: CompanyUser): CompanyMemberResponseDto {
    return {
      email: m.user?.email.value ?? '',
      role: m.role,
      status: m.status,
      userId: m.userId,
      username: m.user?.username ?? '',
    };
  }
}
