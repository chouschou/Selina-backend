import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from 'src/entities/account.entity';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';
import { Role } from 'src/entities/role.entity';
import * as bcrypt from 'bcryptjs';
import {
  ChangeEmployeePasswordDto,
  ChangeOwnPasswordDto,
} from 'src/DTO/auth/change-password.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const existing = await this.accountRepo.findOne({
      where: { Username: createAccountDto.Username },
    });

    if (existing) {
      throw new HttpException('Username already exists', HttpStatus.CONFLICT);
    }

    const role = await this.roleRepo.findOne({
      where: { ID: createAccountDto.Role_ID },
    });

    if (!role) {
      throw new HttpException('Invalid role ID', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(createAccountDto.Password, 10);

    const account = this.accountRepo.create({
      Username: createAccountDto.Username,
      Password: hashedPassword,
      Role: role,
    });

    return this.accountRepo.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accountRepo.find({ relations: ['Role'] });
  }

  async findOne(id: number): Promise<Account> {
    const account = await this.accountRepo.findOne({
      where: { ID: id },
      relations: ['Role', 'Customer'],
    });

    if (!account) {
      throw new Error(`Account with ID ${id} not found`);
    }

    return account;
  }

  async findOneByUsername(username: string): Promise<Account | null> {
    return this.accountRepo.findOne({
      where: { Username: username },
      relations: ['Role'],
    });
  }

  async changeOwnPassword(
    userId: number,
    dto: ChangeOwnPasswordDto,
  ): Promise<string> {
    const account = await this.accountRepo.findOne({ where: { ID: userId } });

    if (!account) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, account.Password);
    if (!isMatch) {
      throw new ForbiddenException('Mật khẩu hiện tại không đúng');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    account.Password = hashed;

    await this.accountRepo.save(account);

    return 'Đổi mật khẩu thành công';
  }

  async changeEmployeePassword(
    dto: ChangeEmployeePasswordDto,
  ): Promise<string> {
    const account = await this.accountRepo.findOne({
      where: { Username: dto.username },
      relations: ['Role'],
    });

    if (!account) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    if (account.Role?.Name !== 'employee') {
      throw new ForbiddenException(
        'Chỉ được phép đổi mật khẩu cho tài khoản nhân viên',
      );
    }

    account.Password = await bcrypt.hash(dto.newPassword, 10);
    await this.accountRepo.save(account);

    return 'Đổi mật khẩu cho nhân viên thành công';
  }
}
