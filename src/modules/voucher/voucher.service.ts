import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { AddAccountVoucherDto } from 'src/DTO/voucher/add-account-voucher.dto';
import { CreateVoucherDto } from 'src/DTO/voucher/create-voucher.dto';
import { UpdateVoucherDto } from 'src/DTO/voucher/update-voucher.dto';
import { VoucherResponseDto } from 'src/DTO/voucher/voucher-response.dto';
import { Account } from 'src/entities/account.entity';
import { AccountVoucher } from 'src/entities/account_voucher.entity';
import { Voucher } from 'src/entities/voucher.entity';
import { In, LessThan, Repository } from 'typeorm';

// Tính thời gian còn lại đến 0h ngày mai
function getMillisecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // 00:00:00 của ngày tiếp theo
  return midnight.getTime() - now.getTime();
}

@Injectable()
export class VoucherService implements OnModuleInit {
  constructor(
    @InjectRepository(Voucher) private voucherRepo: Repository<Voucher>,
    @InjectRepository(AccountVoucher)
    private accountVoucherRepo: Repository<AccountVoucher>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
  ) {}

  async getAll() {
    const vouchers = await this.voucherRepo.find();
    return plainToInstance(VoucherResponseDto, vouchers, {
      excludeExtraneousValues: true,
    });
  }

  async getByIdRaw(id: number): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { ID: id } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async getById(id: number): Promise<VoucherResponseDto> {
    const voucher = await this.getByIdRaw(id);
    return plainToInstance(VoucherResponseDto, voucher, {
      excludeExtraneousValues: true,
    });
  }

  //   async getByAccountId(accountId: number) {
  //     return this.accountVoucherRepo.find({
  //       where: { Account: { ID: accountId } },
  //       relations: ['Voucher'],
  //     });
  //   }
  async getByAccountId(accountId: number) {
    const result = await this.accountVoucherRepo.find({
      where: { Account: { ID: accountId } },
      relations: ['Voucher'],
    });

    return result.map((av) => {
      return {
        ...av,
        Voucher: plainToInstance(VoucherResponseDto, av.Voucher, {
          excludeExtraneousValues: true,
        }),
      };
    });
  }

  async create(dto: CreateVoucherDto) {
    const voucher = this.voucherRepo.create(dto);
    return this.voucherRepo.save(voucher);
  }

  async update(id: number, dto: UpdateVoucherDto) {
    const voucher = await this.getById(id);

    // Kiểm tra xem đã có ai nhận voucher chưa
    const used = await this.accountVoucherRepo.count({
      where: {
        Voucher: { ID: id },
      },
    });

    if (used > 0) {
      throw new ForbiddenException(
        'Voucher đã được gán cho người dùng, không thể chỉnh sửa',
      );
    }

    Object.assign(voucher, dto);
    return this.voucherRepo.save(voucher);
  }

  async delete(id: number) {
    const voucher = await this.getByIdRaw(id);

    // Kiểm tra nếu đã có người nhận voucher → không cho xóa
    const used = await this.accountVoucherRepo.count({
      where: {
        Voucher: { ID: id },
      },
    });

    if (used > 0) {
      throw new ForbiddenException(
        'Voucher đã được gán cho người dùng, không thể xóa',
      );
    }

    return this.voucherRepo.remove(voucher);
  }

  // Xóa voucher đã hết hạn
  onModuleInit() {
    const timeUntilMidnight = getMillisecondsUntilMidnight();

    // Chờ đến đúng 0h đêm hôm nay
    setTimeout(() => {
      void this.deleteExpiredVouchers().catch((err) => {
        console.error('Lỗi khi xóa voucher hết hạn:', err);
      }); // Gọi lần đầu ngay tại 0h

      // Sau đó thiết lập chạy mỗi 24 giờ
      setInterval(
        () => {
          void this.deleteExpiredVouchers().catch((err) => {
            console.error('Lỗi khi xóa voucher hết hạn-:', err);
          });
        },
        24 * 60 * 60 * 1000,
      ); // mỗi 24h
    }, timeUntilMidnight);
  }

  async deleteExpiredVouchers() {
    const now = new Date();

    // Lấy tất cả voucher đã hết hạn
    const expiredVouchers = await this.voucherRepo.find({
      where: {
        EndDate: LessThan(now),
      },
    });

    if (expiredVouchers.length === 0) {
      return { deleted: 0 };
    }

    const voucherIds = expiredVouchers.map((v) => v.ID);

    // Xoá tất cả bản ghi trong AccountVoucher liên quan đến các voucher hết hạn
    await this.accountVoucherRepo.delete({
      Voucher: In(voucherIds),
    });

    // Xoá các voucher hết hạn
    await this.voucherRepo.remove(expiredVouchers);

    return {
      deleted: expiredVouchers.length,
    };
  }

  async addAccountVoucher(dto: AddAccountVoucherDto) {
    const account = await this.accountRepo.findOne({
      where: { ID: dto.Account_ID },
    });

    const voucher = await this.voucherRepo.findOne({
      where: { ID: dto.Voucher_ID },
    });

    if (!account || !voucher) {
      throw new NotFoundException('Account hoặc Voucher không tồn tại');
    }

    // Nếu account đã có voucher này rồi → không cho lấy thêm
    const existed = await this.accountVoucherRepo.findOne({
      where: {
        Account: { ID: dto.Account_ID },
        Voucher: { ID: dto.Voucher_ID },
      },
    });

    if (existed) {
      throw new BadRequestException('Tài khoản đã nhận voucher này rồi');
    }

    // Nếu voucher không còn số lượng
    if (voucher.RemainingQuantity <= 0) {
      throw new BadRequestException('Voucher đã hết số lượng');
    }

    // Tạo bản ghi AccountVoucher
    const av = this.accountVoucherRepo.create({
      Account: account,
      Voucher: voucher,
      Status: false, // Mặc định là chưa sử dụng
    });

    // Giảm RemainingQuantity
    voucher.RemainingQuantity -= 1;

    await this.voucherRepo.save(voucher);
    return this.accountVoucherRepo.save(av);
  }
}
