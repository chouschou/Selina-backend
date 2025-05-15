import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  Address: string;
  Province: string;
  PhoneNumber: string;
  Name: string;
}
