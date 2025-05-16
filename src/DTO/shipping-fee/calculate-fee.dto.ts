import { IsNumber, IsString } from 'class-validator';

export class CalculateShippingFeeDto {
  @IsString()
  StoreLocation: string;

  @IsNumber()
  Distance: number;
}
