import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  Username: string;

  @IsNotEmpty()
  @IsString()
  Password: string;
}
