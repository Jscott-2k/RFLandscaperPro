import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../payments/entities/payment.entity';

class InvoiceJobDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  title: string;
}

class InvoiceCustomerDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
}

class InvoicePaymentDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  amount: number;
  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;
  @ApiPropertyOptional()
  paymentProcessor?: string;
}

export class InvoiceResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty({ type: InvoiceJobDto })
  job: InvoiceJobDto;
  @ApiProperty({ type: InvoiceCustomerDto })
  customer: InvoiceCustomerDto;
  @ApiProperty()
  amount: number;
  @ApiPropertyOptional()
  dueDate?: Date;
  @ApiProperty({ type: [InvoicePaymentDto], required: false })
  payments?: InvoicePaymentDto[];
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
