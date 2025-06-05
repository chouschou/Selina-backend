import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '../account/account.service';
import * as bcrypt from 'bcryptjs';
import { Account } from '../../entities/account.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';

type SafeAccount = Omit<Account, 'Password'>;

interface JwtPayload {
  username: string;
  sub: number;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private accountService: AccountService,
  ) {}

  async validateUser(
    username: string,
    pass: string,
  ): Promise<SafeAccount | null> {
    const account = await this.accountService.findOneByUsername(username);

    if (!account) {
      throw new HttpException(
        'Username does not exist',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(pass, account.Password);

    if (!isPasswordValid) {
      throw new HttpException('Incorrect password', HttpStatus.UNAUTHORIZED);
    }

    const { Password: _, ...safeData } = account;
    return safeData as SafeAccount;
  }

  async login(user: Pick<Account, 'ID' | 'Username' | 'Role'>) {
    const payload = {
      username: user.Username,
      sub: user.ID,
      role: user.Role.Name,
    };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });
    return { user, access_token, refresh_token };
  }

  async register(createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountService.create(createAccountDto);
  }

  // Refresh token

  async refreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        { secret: process.env.JWT_SECRET },
      );

      const user = await this.findById(decoded.sub);
      if (!user) throw new Error('User not found');

      const payload = {
        username: user.Username,
        sub: user.ID,
        role: user.Role.Name,
      };

      const access_token = await this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      });
      const refresh_token = await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      });

      return { access_token, refresh_token, user };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async findById(id: number): Promise<Account | null> {
    return this.accountService.findOne(id);
  }
}
