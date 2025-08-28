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
  Req,
} from '@nestjs/common';

import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ScheduleJobDto } from './dto/schedule-job.dto';
import { AssignJobDto } from './dto/assign-job.dto';
import { BulkAssignJobDto } from './dto/bulk-assign-job.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Create job' })
  @ApiResponse({
    status: 201,
    description: 'Job created',
    type: JobResponseDto,
  })
  create(
    @Body() createJobDto: CreateJobDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<JobResponseDto> {
    return this.jobsService.create(createJobDto, req.user.companyId);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'List jobs for the authenticated company' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'completed', required: false, type: Boolean })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'workerId', required: false, type: Number })
  @ApiQuery({ name: 'equipmentId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Req() req: { user: { companyId: number } },
    @Query('completed', new ParseBoolPipe({ optional: true }))
    completed?: boolean,
    @Query('customerId', new ParseIntPipe({ optional: true }))
    customerId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('workerId', new ParseIntPipe({ optional: true })) workerId?: number,
    @Query('equipmentId', new ParseIntPipe({ optional: true }))
    equipmentId?: number,
  ): Promise<{ items: JobResponseDto[]; total: number }> {
    return this.jobsService.findAll(
      pagination,
      req.user.companyId,
      completed,
      customerId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      workerId,
      equipmentId,
    );
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'Get job by id' })
  @ApiResponse({
    status: 200,
    description: 'Job retrieved',
    type: JobResponseDto,
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<JobResponseDto> {
    return this.jobsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({
    status: 200,
    description: 'Job updated',
    type: JobResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<JobResponseDto> {
    return this.jobsService.update(id, updateJobDto, req.user.companyId);
  }

  @Post(':id/schedule')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Schedule job' })
  @ApiResponse({
    status: 200,
    description: 'Job scheduled',
    type: JobResponseDto,
  })
  schedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() scheduleJobDto: ScheduleJobDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<JobResponseDto> {
    return this.jobsService.schedule(id, scheduleJobDto, req.user.companyId);
  }

  @Post(':id/assign')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Assign resources to job' })
  @ApiResponse({
    status: 200,
    description: 'Job assignment added',
    type: JobResponseDto,
  })
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignJobDto: AssignJobDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<JobResponseDto> {
    return this.jobsService.assign(id, assignJobDto, req.user.companyId);
  }

  @Post(':id/bulk-assign')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Assign multiple resources to job' })
  @ApiResponse({
    status: 200,
    description: 'Multiple job assignments added',
    type: JobResponseDto,
  })
  bulkAssign(
    @Param('id', ParseIntPipe) id: number,
    @Body() bulkAssignJobDto: BulkAssignJobDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<JobResponseDto> {
    return this.jobsService.bulkAssign(
      id,
      bulkAssignJobDto,
      req.user.companyId,
    );
  }

  @Delete(':id/assignments/:assignmentId')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Remove assignment from job' })
  @ApiResponse({
    status: 200,
    description: 'Assignment removed',
    type: JobResponseDto,
  })
  removeAssignment(
    @Param('id', ParseIntPipe) jobId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<JobResponseDto> {
    return this.jobsService.removeAssignment(
      jobId,
      assignmentId,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ status: 204, description: 'Job deleted' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<void> {
    await this.jobsService.remove(id, req.user.companyId);
  }
}
