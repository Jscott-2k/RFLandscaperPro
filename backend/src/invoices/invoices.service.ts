import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Job } from '../jobs/entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: createInvoiceDto.jobId },
    });
    if (!job) {
      throw new NotFoundException(
        `Job with ID ${createInvoiceDto.jobId} not found.`,
      );
    }
    const customer = await this.customerRepository.findOne({
      where: { id: createInvoiceDto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${createInvoiceDto.customerId} not found.`,
      );
    }
    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      job,
      customer,
    });
    const saved = await this.invoiceRepository.save(invoice);
    return this.toInvoiceResponseDto(saved);
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ items: InvoiceResponseDto[]; total: number }> {
    const [invoices, total] = await this.invoiceRepository.findAndCount({
      relations: ['job', 'customer', 'payments'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: invoices.map((inv) => this.toInvoiceResponseDto(inv)),
      total,
    };
  }

  async findOne(id: number): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['job', 'customer', 'payments'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
    return this.toInvoiceResponseDto(invoice);
  }

  async update(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['job', 'customer', 'payments'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
    const { jobId, customerId, ...data } = updateInvoiceDto as any;
    if (jobId !== undefined) {
      const job = await this.jobRepository.findOne({ where: { id: jobId } });
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found.`);
      }
      invoice.job = job;
    }
    if (customerId !== undefined) {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found.`);
      }
      invoice.customer = customer;
    }
    Object.assign(invoice, data);
    const updated = await this.invoiceRepository.save(invoice);
    return this.toInvoiceResponseDto(updated);
  }

  async remove(id: number): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }
    await this.invoiceRepository.remove(invoice);
  }

  private toInvoiceResponseDto(invoice: Invoice): InvoiceResponseDto {
    return {
      id: invoice.id,
      job: {
        id: invoice.job.id,
        title: invoice.job.title,
      },
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        email: invoice.customer.email,
      },
      amount: Number(invoice.amount),
      dueDate: invoice.dueDate,
      payments: invoice.payments?.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paymentProcessor: p.paymentProcessor,
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
