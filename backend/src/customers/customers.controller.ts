import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created',
    type: CustomerResponseDto,
  })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(
      createCustomerDto,
      req.user.companyId,
    );
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'List customers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of customers' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<{ items: CustomerResponseDto[]; total: number }> {
    return this.customersService.findAll(
      pagination,
      req.user.companyId,
    );
  }

  @Get('profile')
  @Roles(UserRole.Customer)
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile',
    type: CustomerResponseDto,
  })
  async getProfile(
    @Req() req: { user: { userId: number; companyId: number } },
  ): Promise<CustomerResponseDto> {
    return this.customersService.findByUserId(
      req.user.userId,
      req.user.companyId,
    );
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved',
    type: CustomerResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated',
    type: CustomerResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(
      id,
      updateCustomerDto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 204, description: 'Customer deleted' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<void> {
    await this.customersService.remove(id, req.user.companyId);
  }
}
