import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateShippingFeeDto {
  @IsOptional()
  @IsString()
  StoreLocation: string;

  @IsOptional()
  @IsNumber()
  BasicFee: number;

  @IsOptional()
  @IsNumber()
  BasicDistance: number;

  @IsOptional()
  @IsNumber()
  Surcharge: number;

  @IsOptional()
  @IsString()
  SurchargeUnit: string;
}
