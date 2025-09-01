import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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

import { AuthUser } from '../common/decorators/auth-user.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { type PaginationParams, type Paginated } from '../common/pagination';
import { UserRole , type User } from '../users/user.entity';
import { CustomersService } from './customers.service';
import { type CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { type UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Create customer' })
  @ApiResponse({
    description: 'Customer created',
    status: 201,
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CompanyId() companyId: number,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(createCustomerDto, companyId);
  }

  @Get()
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'List customers for the authenticated company' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ description: 'List of customers', status: 200 })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query() pagination: PaginationParams,
    @CompanyId() companyId: number,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
    @Query('search') search?: string,
  ): Promise<Paginated<CustomerResponseDto>> {
    return this.customersService.findAll(pagination, companyId, active, search);
  }

  @Get('profile')
  @Roles(UserRole.Customer)
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiResponse({
    description: 'Customer profile',
    status: 200,
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getProfile(
    @AuthUser() user: User | undefined,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findByUserId(user!.id, user!.companyId!);
  }

  @Get(':id')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiResponse({
    description: 'Customer retrieved',
    status: 200,
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({
    description: 'Customer updated',
    status: 200,
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CompanyId() companyId: number,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, updateCustomerDto, companyId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Activate customer' })
  @ApiResponse({
    description: 'Customer activated',
    status: 200,
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<CustomerResponseDto> {
    return this.customersService.activate(id, companyId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Deactivate customer' })
  @ApiResponse({
    description: 'Customer deactivated',
    status: 200,
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<CustomerResponseDto> {
    return this.customersService.deactivate(id, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ description: 'Customer deleted', status: 204 })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<void> {
    await this.customersService.remove(id, companyId);
  }
}
