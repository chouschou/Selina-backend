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
import { MailService } from '../email/mail.service';
import { OtpService } from '../email/otp.service';
import { Account } from 'src/entities/account.entity';
interface RegisterResponse {
  message: string;
  account: Account;
}
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mailService: MailService,
    private otpService: OtpService,
  ) {}

  @Post('send-otp')
  async sendOtp(@Body('email') email: string) {
    const otp = this.otpService.generateOtp(email);
    await this.mailService.sendOtp(email, otp);
    return { message: 'OTP đã được gửi' };
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    const valid = this.otpService.verifyOtp(email, otp);
    return valid
      ? { success: true }
      : { success: false, message: 'OTP không đúng hoặc đã hết hạn' };
  }

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
  async register(@Body() dto: CreateAccountDto): Promise<RegisterResponse> {
    const account = await this.authService.create(dto);
    return {
      message: 'Đăng ký thành công',
      account,
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const token = await this.authService.generateResetToken(email);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.mailService.sendResetPasswordEmail(email, resetLink);
    return { message: 'Email đặt lại mật khẩu đã được gửi.' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
