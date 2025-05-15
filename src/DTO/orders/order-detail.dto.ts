import { Transform } from 'class-transformer';
import { IsDecimal, IsNumber } from 'class-validator';

export class OrderDetailDto {
  @IsNumber()
  GlassColorId: number;

  @IsNumber()
  Quantity: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Price must be a number with up to 2 decimal places' },
  )
  Price: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Discount must be a number with up to 2 decimal places' },
  )
  Discount: number;
}
