import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateShippingFeeDto {
  @IsString()
  StoreLocation: string;

  @IsNumber()
  BasicFee: number;

  @IsNumber()
  BasicDistance: number;

  @IsNumber()
  Surcharge: number;

  @IsString()
  SurchargeUnit: string;
}
