import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGlassDto {
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
}
