import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateImageDto {
  @IsNotEmpty()
  @IsInt()
  object_ID: number;
  @IsNotEmpty()
  object_type: string;
  @IsNotEmpty()
  ImagePath: string;
}
