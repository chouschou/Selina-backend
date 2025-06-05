import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GlassColorDto {
  @Transform(({ value }) => Number(value))
  ID?: number;

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
  Image3DPath?: string;

  Images?: string[];

  @IsString()
  @IsNotEmpty()
  Status: string;
}
