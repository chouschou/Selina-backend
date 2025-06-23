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
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Role } from 'src/entities/role.entity';
import { Customer } from 'src/entities/customer.entity';

type SafeAccount = Omit<Account, 'Password'>;
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface JwtPayload {
  username: string;
  sub: number;
}

@Injectable()
export class AuthService {
  private oauth2Client: OAuth2Client;

  constructor(
    private jwtService: JwtService,
    private accountService: AccountService,
    private roleService: RoleService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
  ) {
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.FRONTEND_URL}/`,
    );

    console.log('OAuth2 client initialized:', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.FRONTEND_URL}/`,
    });
  }

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

  async verifyGoogleToken(token: string): Promise<TokenPayload> {
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return payload;
  }

  async loginGoogle(idToken: string) {
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException(
        'Thông tin tài khoản Google không hợp lệ',
      );
    }

    const { email, name, picture } = payload;

    let account = await this.accountRepository.findOneBy({ Username: email });

    if (!account) {
      const defaultRole = await this.roleRepository.findOneBy({ ID: 1 });
      if (!defaultRole)
        throw new NotFoundException('Role mặc định không tồn tại');

      // --- Tạo Account ---
      account = this.accountRepository.create({
        Username: email,
        Password: '',
        Role: defaultRole,
      });
      await this.accountRepository.save(account);

      // --- Tạo Customer ---
      const customer = this.customerRepository.create({
        Email: email,
        Name: name,
        Avatar: picture,
        Account: account,
      });
      await this.customerRepository.save(customer);
    }

    // Payload để tạo JWT
    const jwtPayload = {
      username: account.Username,
      sub: account.ID,
      role: account.Role?.Name,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: '7d',
    });

    return {
      message: 'Đăng nhập bằng Google thành công',
      accessToken,
      refreshToken,
      account,
    };
  }
}
