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
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';

type UploadedFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
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
  create(@Body() createJobDto: CreateJobDto): Promise<JobResponseDto> {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'List jobs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<{ items: JobResponseDto[]; total: number }> {
    return this.jobsService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'Get job by id' })
  @ApiResponse({
    status: 200,
    description: 'Job retrieved',
    type: JobResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<JobResponseDto> {
    return this.jobsService.findOne(id);
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
  ): Promise<JobResponseDto> {
    return this.jobsService.update(id, updateJobDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ status: 204, description: 'Job deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.jobsService.remove(id);
  }

  @Post(':id/images')
  @Roles(UserRole.Admin, UserRole.Worker)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload job image' })
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFile,
  ) {
    return this.jobsService.addImage(id, file);
  }

  @Get(':jobId/images/:imageId')
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'Get job image' })
  async getImage(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Res() res: Response,
  ) {
    const image = await this.jobsService.getImage(jobId, imageId);
    return res.sendFile(path.resolve(image.path));
  }
}
