import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { Express } from 'express';

export class GlassColorUploadDto {
  @IsString()
  @IsNotEmpty()
  Color: string;

  @Type(() => Number)
  @IsNumber()
  Quantity: number;

  @Type(() => Number)
  @IsNumber()
  Price: number;

  @Type(() => Number)
  @IsNumber()
  Discount: number;

  @IsString()
  @IsNotEmpty()
  Status: string;

  @IsOptional()
  ModelVirtualTryOn?: Express.Multer.File;

  @IsOptional()
  Image3DPath?: Express.Multer.File;

  @IsOptional()
  Images?: Express.Multer.File[];
}
