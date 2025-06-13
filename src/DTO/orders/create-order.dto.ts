import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderDetailDto } from './order-detail.dto';

export class CreateOrderDto {
  @IsNumber()
  DeliveryAddressId: number;

  @IsNumber()
  Total: number;

  @IsNumber()
  ShippingFee: number;

  @IsNumber()
  VoucherDiscount: number;

  @IsString()
  Status: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderDetailDto)
  OrderDetails: OrderDetailDto[];

  @IsOptional()
  @IsNumber()
  AccountVoucherId?: number;

  @IsOptional()
  @IsString()
  TransactionCode?: string;
}
