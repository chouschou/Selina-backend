import {
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGlassColorDto {
  @IsOptional()
  @IsNumber()
  ID?: number;

  @IsOptional()
  @IsString()
  Color?: string;

  @IsOptional()
  @IsNumber()
  Quantity?: number;

  @IsOptional()
  @IsNumber()
  Price?: number;

  @IsOptional()
  @IsNumber()
  Discount?: number;

  @IsString()
  @IsNotEmpty()
  ModelVirtualTryOn: string;

  @IsOptional()
  @IsString()
  Image3DPath?: string;

  @IsString()
  @IsNotEmpty()
  Status: string;

  @IsOptional()
  @IsArray()
  Images?: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  Category?: string;

  @IsOptional()
  @IsString()
  Shape?: string;

  @IsOptional()
  @IsString()
  Material?: string;

  @IsOptional()
  @IsString()
  Description?: string;

  @IsOptional()
  @IsString()
  Age?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGlassColorDto)
  GlassColors?: UpdateGlassColorDto[];
}
