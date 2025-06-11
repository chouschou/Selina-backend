import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAccountDeliveryDto {
  @IsString()
  Name: string;

  @IsString()
  Address: string;

  @IsString()
  Province: string;

  @IsString()
  PhoneNumber: string;

  @IsOptional()
  @IsBoolean()
  IsDefault?: boolean;
}
