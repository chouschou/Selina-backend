import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from 'src/entities/account.entity';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';
import { Role } from 'src/entities/role.entity';
import * as bcrypt from 'bcryptjs';

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
      relations: ['Role'],
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
}
