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
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created', type: InvoiceResponseDto })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'List invoices' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<{ items: InvoiceResponseDto[]; total: number }> {
    return this.invoicesService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Get invoice by id' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved', type: InvoiceResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated', type: InvoiceResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({ status: 204, description: 'Invoice deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.invoicesService.remove(id);
  }
}
