import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangeOwnPasswordDto {
  @IsNotEmpty()
  currentPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class ChangeEmployeePasswordDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
