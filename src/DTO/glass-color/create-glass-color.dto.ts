import { IsString, IsNumber, IsNotEmpty, IsDecimal } from 'class-validator';

export class CreateGlassColorDto {
  @IsNumber()
  Glass_ID: number;

  @IsString()
  @IsNotEmpty()
  Color: string;

  @IsNumber()
  Quantity: number;

  @IsDecimal()
  Price: number;

  @IsDecimal()
  Discount: number;

  @IsString()
  @IsNotEmpty()
  Image3DPath: string;
}
