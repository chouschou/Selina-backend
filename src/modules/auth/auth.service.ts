import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountService } from '../account/account.service';
import * as bcrypt from 'bcryptjs';
import { Account } from '../../entities/account.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleService } from '../role/role.service';

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
    private roleService: RoleService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
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

  async create(dto: CreateAccountDto): Promise<Account> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.Password, salt);

    const role = await this.roleService.findOne(dto.Role_ID); // lấy Role entity

    const account = this.accountRepository.create({
      Username: dto.Username,
      Password: hashedPassword,
      Role: role, // gán object Role, không phải ID
    });

    return this.accountRepository.save(account);
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

  async generateResetToken(email: string): Promise<string> {
    const account = await this.accountRepository.findOneBy({ Username: email });
    if (!account) throw new NotFoundException('Email này chưa đăng ký.');

    const payload = { sub: account.ID, username: account.Username };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      const account = await this.accountRepository.findOneBy({
        ID: decoded.sub,
      });

      if (!account) {
        throw new NotFoundException('Không tìm thấy tài khoản.');
      }

      const hashed = await bcrypt.hash(newPassword, await bcrypt.genSalt());
      account.Password = hashed;
      await this.accountRepository.save(account);
    } catch (err) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}
