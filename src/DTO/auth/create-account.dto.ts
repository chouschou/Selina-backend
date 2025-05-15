import { IsNotEmpty, IsString, IsNumber, IsEmail } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsEmail()
  Username: string;

  @IsNotEmpty()
  @IsString()
  Password: string;

  @IsNotEmpty()
  @IsNumber()
  Role_ID: number;
}
