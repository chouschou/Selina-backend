import { Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDecimal,
  IsNotEmpty,
} from 'class-validator';

export class UpdateGlassColorDto {
  @IsOptional()
  @IsNumber()
  ID?: number; // Cho phép có ID khi update

  @IsOptional()
  @IsNumber()
  Glass_ID?: number;

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
  ModelVirtualTryOn: string;

  @IsString()
  @IsNotEmpty()
  Image3DPath: string;
}
