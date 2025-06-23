import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthController } from '../auth/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '../auth/local.strategy';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AccountModule } from '../account/account.module';
import { MailService } from '../email/mail.service';
import { OtpService } from '../email/otp.service';
import { Account } from 'src/entities/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey', // Mật khẩu bảo mật
      signOptions: { expiresIn: '1h' }, // Thời gian hết hạn access token
    }),
    AccountModule,
    RoleModule,
    TypeOrmModule.forFeature([Account]),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, MailService, OtpService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
