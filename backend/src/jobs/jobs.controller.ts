import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ParseBoolPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CompanyId } from '../common/decorators/company-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { type PaginationParams, type Paginated } from '../common/pagination';
import { UserRole } from '../users/user.entity';
import { type AssignJobDto } from './dto/assign-job.dto';
import { type BulkAssignJobDto } from './dto/bulk-assign-job.dto';
import { type CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { type ScheduleJobDto } from './dto/schedule-job.dto';
import { type UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Create job' })
  @ApiResponse({
    description: 'Job created',
    status: 201,
    type: JobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  create(
    @Body() createJobDto: CreateJobDto,
    @CompanyId() companyId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.create(createJobDto, companyId);
  }

  @Get()
  @Roles(UserRole.CompanyAdmin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'List jobs for the authenticated company' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: Number })
  @ApiQuery({ name: 'completed', required: false, type: Boolean })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'workerId', required: false, type: Number })
  @ApiQuery({ name: 'equipmentId', required: false, type: Number })
  @ApiResponse({ description: 'List of jobs', status: 200 })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(
    @Query() pagination: PaginationParams,
    @CompanyId() companyId: number,
    @Query('completed', new ParseBoolPipe({ optional: true }))
    completed?: boolean,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('workerId', new ParseIntPipe({ optional: true })) workerId?: number,
    @Query('equipmentId', new ParseIntPipe({ optional: true }))
    equipmentId?: number,
  ): Promise<Paginated<JobResponseDto>> {
    return this.jobsService.findAll(
      pagination,
      companyId,
      completed,
      customerId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      workerId,
      equipmentId,
    );
  }

  @Get(':id')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'Get job by id' })
  @ApiResponse({
    description: 'Job retrieved',
    status: 200,
    type: JobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({
    description: 'Job updated',
    status: 200,
    type: JobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @CompanyId() companyId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.update(id, updateJobDto, companyId);
  }

  @Post(':id/schedule')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Schedule job' })
  @ApiResponse({
    description: 'Job scheduled',
    status: 200,
    type: JobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  schedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() scheduleJobDto: ScheduleJobDto,
    @CompanyId() companyId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.schedule(id, scheduleJobDto, companyId);
  }

  @Post(':id/assign')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Assign resources to job' })
  @ApiResponse({
    description: 'Job assignment added',
    status: 200,
    type: JobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignJobDto: AssignJobDto,
    @CompanyId() companyId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.assign(id, assignJobDto, companyId);
  }

  @Post(':id/bulk-assign')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Assign multiple resources to job' })
  @ApiResponse({
    description: 'Multiple job assignments added',
    status: 200,
    type: JobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  bulkAssign(
    @Param('id', ParseIntPipe) id: number,
    @Body() bulkAssignJobDto: BulkAssignJobDto,
    @CompanyId() companyId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.bulkAssign(id, bulkAssignJobDto, companyId);
  }

  @Delete(':id/assignments/:assignmentId')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Remove assignment from job' })
  @ApiResponse({
    description: 'Assignment removed',
    status: 200,
    type: JobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  removeAssignment(
    @Param('id', ParseIntPipe) jobId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CompanyId() companyId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.removeAssignment(jobId, assignmentId, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ description: 'Job deleted', status: 204 })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<void> {
    await this.jobsService.remove(id, companyId);
  }
}
