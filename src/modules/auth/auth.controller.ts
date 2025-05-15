import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../../DTO/auth/login.dto';
import { RefreshTokenDto } from '../../DTO/auth/refresh-token.dto';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.Username,
      loginDto.Password,
    );

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.login({
      ID: user.ID,
      Username: user.Username,
      Role: user.Role,
    });
  }

  @Post('register')
  async register(@Body() dto: CreateAccountDto) {
    return this.authService.register(dto);
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
