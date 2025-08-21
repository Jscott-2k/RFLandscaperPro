import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
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
    @Req() req: { companyId: number },
    @Body() createJobDto: CreateJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.create(req.companyId, createJobDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'List jobs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  findAll(
    @Req() req: { companyId: number },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<{ items: JobResponseDto[]; total: number }> {
    return this.jobsService.findAll(req.companyId, page, limit);
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
    @Req() req: { companyId: number },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.findOne(req.companyId, id);
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
    @Req() req: { companyId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.update(req.companyId, id, updateJobDto);
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
    @Req() req: { companyId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() scheduleJobDto: ScheduleJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.schedule(req.companyId, id, scheduleJobDto);
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
    @Req() req: { companyId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() assignJobDto: AssignJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.assign(req.companyId, id, assignJobDto);
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
    @Req() req: { companyId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() bulkAssignJobDto: BulkAssignJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.bulkAssign(req.companyId, id, bulkAssignJobDto);
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
    @Req() req: { companyId: number },
    @Param('id', ParseIntPipe) jobId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ): Promise<JobResponseDto> {
    return this.jobsService.removeAssignment(
      req.companyId,
      jobId,
      assignmentId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ status: 204, description: 'Job deleted' })
  async remove(
    @Req() req: { companyId: number },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.jobsService.remove(req.companyId, id);
  }
}
