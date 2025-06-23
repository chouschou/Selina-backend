import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Account } from 'src/entities/account.entity';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';
import { Role } from 'src/entities/role.entity';
import * as bcrypt from 'bcryptjs';
import {
  ChangeEmployeePasswordDto,
  ChangeOwnPasswordDto,
} from 'src/DTO/auth/change-password.dto';
import { Customer } from 'src/entities/customer.entity';
import { S3Service } from 'src/shared/s3.service';
import { UpdateCustomerDto } from 'src/DTO/customer/update-info-customer';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    private readonly s3Service: S3Service,
  ) {}

  async createCustomerInfo(
    accountId: number,
    dto: UpdateCustomerDto,
    avatarFile?: Express.Multer.File,
  ): Promise<Customer> {
    const account = await this.accountRepo.findOne({
      where: { ID: accountId },
      relations: ['Customer'],
    });

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }

    if (account.Customer) {
      throw new BadRequestException('Tài khoản đã có thông tin khách hàng.');
    }

    let avatarUrl: string | null = null;

    if (avatarFile) {
      avatarUrl = await this.s3Service.uploadFile(
        avatarFile.buffer,
        avatarFile.originalname,
        'avatars',
      );
    }

    const customerData: DeepPartial<Customer> = {
      Email: account.Username,
      Name: dto.name,
      PhoneNumber: dto.phoneNumber,
      Gender: dto.gender,
      DateOfBirth: dto.dateOfBirth !== undefined && new Date(dto.dateOfBirth),
      Avatar: avatarUrl,
      Account: account,
    };

    const newCustomer = this.customerRepo.create(customerData);
    return this.customerRepo.save(newCustomer);
  }

  async updateCustomerInfo(
    accountId: number,
    dto: UpdateCustomerDto,
    avatarFile?: Express.Multer.File,
  ): Promise<Customer> {
    const account = await this.accountRepo.findOne({
      where: { ID: accountId },
      relations: ['Customer'],
    });

    if (!account || !account.Customer) {
      throw new NotFoundException('Không tìm thấy tài khoản hoặc khách hàng.');
    }

    const customer = account.Customer;

    // Cập nhật các field thông thường
    if (dto.name !== undefined) customer.Name = dto.name;
    if (dto.phoneNumber !== undefined) customer.PhoneNumber = dto.phoneNumber;
    if (dto.gender !== undefined) customer.Gender = dto.gender;
    if (dto.dateOfBirth !== undefined) {
      customer.DateOfBirth = new Date(dto.dateOfBirth);
    }

    // --- Xử lý avatar mới (nếu có) ---
    if (avatarFile) {
      const oldUrl = customer.Avatar || null;
      const newUrl = await this.s3Service.uploadFile(
        avatarFile.buffer,
        avatarFile.originalname,
        'avatars',
      );

      // Xoá ảnh cũ nếu có và khác ảnh mới
      if (oldUrl && oldUrl !== newUrl) {
        await this.s3Service.deleteFileFromS3(oldUrl);
      }

      customer.Avatar = newUrl;
    } else if (
      dto.avatar !== undefined &&
      dto.avatar.trim() === '' &&
      customer.Avatar
    ) {
      // Nếu frontend gửi chuỗi rỗng → yêu cầu xoá avatar
      await this.s3Service.deleteFileFromS3(customer.Avatar);
      customer.Avatar = null;
    }

    return this.customerRepo.save(customer);
  }

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
