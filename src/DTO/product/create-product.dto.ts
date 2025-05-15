import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsNumber,
  IsDecimal,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class GlassColorDto {
  @IsString()
  @IsNotEmpty()
  Color: string;

  @IsNumber()
  Quantity: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  Price: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  Discount: number;

  @IsString()
  @IsNotEmpty()
  Image3DPath: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  Category: string;

  @IsString()
  @IsNotEmpty()
  Shape: string;

  @IsString()
  @IsNotEmpty()
  Material: string;

  @IsString()
  @IsNotEmpty()
  Description: string;

  @IsString()
  @IsNotEmpty()
  Age: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlassColorDto)
  GlassColors: GlassColorDto[];
}
