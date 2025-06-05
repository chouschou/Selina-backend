import { IsNumber, IsString } from 'class-validator';

export class UploadImageDto {
  @IsNumber()
  object_ID: number;

  @IsString()
  object_type: string;
}
