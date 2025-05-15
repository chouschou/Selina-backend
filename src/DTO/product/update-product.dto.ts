import { IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateGlassColorDto } from '../glass-color/update-glass-color';

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
