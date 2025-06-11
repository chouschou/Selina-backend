import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDeliveryDto } from 'src/DTO/account-delivery/create-account-delivery.dto';
import { Account } from 'src/entities/account.entity';
import { AccountDelivery } from 'src/entities/account_delivery.entity';
import { DeliveryAddress } from 'src/entities/delivery_address.entity';
import { Order } from 'src/entities/order.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AccountDeliveryService {
  constructor(
    @InjectRepository(AccountDelivery)
    private readonly accountDeliveryRepo: Repository<AccountDelivery>,
    @InjectRepository(DeliveryAddress)
    private readonly deliveryAddressRepo: Repository<DeliveryAddress>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly dataSource: DataSource,
  ) {}
  async isUsedInOrder(accountDeliveryId: number): Promise<boolean> {
    const count = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .where('order.Account_Delivery_ID = :id', { id: accountDeliveryId })
      .getCount();

    return count > 0;
  }

  //   async create(dto: CreateAccountDeliveryDto) {
  //     const address = await this.deliveryAddressRepo.findOneBy({
  //       ID: dto.DeliveryAddressID,
  //     });
  //     if (!address) {
  //       throw new NotFoundException('Delivery address not found');
  //     }

  //     const account = await this.accountRepo.findOneBy({ ID: dto.AccountID });
  //     if (!account) {
  //       throw new NotFoundException('Account not found');
  //     }

  //     const accountDelivery = new AccountDelivery();
  //     accountDelivery.Account = account;
  //     accountDelivery.DeliveryAddress = address;

  //     return this.accountDeliveryRepo.save(accountDelivery);
  //   }
  async create(accountId: number, dto: CreateAccountDeliveryDto) {
    return this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { ID: accountId },
        relations: ['AccountDeliveries'],
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      const hasNoPreviousDelivery =
        !account.AccountDeliveries || account.AccountDeliveries.length === 0;

      // Tạo mới địa chỉ giao hàng
      const address = this.deliveryAddressRepo.create(dto);
      await manager.save(address);

      // Nếu địa chỉ mới là mặc định, update các địa chỉ cũ thành không mặc định
      if (dto.IsDefault === true) {
        await manager
          .createQueryBuilder()
          .update(AccountDelivery)
          .set({ IsDefault: false })
          .where('Account_ID = :accountId', { accountId })
          .execute();
      }

      // Tạo bản ghi AccountDelivery (không dùng save để tránh lỗi update rỗng)
      const isDefault =
        dto.IsDefault === true ? true : hasNoPreviousDelivery ? true : false;

      await manager.insert(AccountDelivery, {
        Account: { ID: accountId },
        DeliveryAddress: { ID: address.ID },
        IsDefault: isDefault,
      });

      return { success: true };
    });
  }
  async update(
    accountId: number,
    deliveryId: number,
    dto: CreateAccountDeliveryDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const accountDelivery = await manager.findOne(AccountDelivery, {
        where: {
          ID: deliveryId,
          Account: { ID: accountId },
        },
        relations: ['DeliveryAddress', 'Account'],
      });

      if (!accountDelivery) {
        throw new NotFoundException(
          'Địa chỉ không tồn tại hoặc không thuộc tài khoản này.',
        );
      }

      //Cập nhật DeliveryAddress (chỉ update các trường hợp lệ)
      await manager.update(
        DeliveryAddress,
        accountDelivery.DeliveryAddress.ID,
        {
          Name: dto.Name,
          PhoneNumber: dto.PhoneNumber,
          Province: dto.Province,
          Address: dto.Address,
        },
      );

      // Nếu là địa chỉ mặc định mới, gỡ mặc định của các địa chỉ khác
      if (dto.IsDefault === true) {
        await manager
          .createQueryBuilder()
          .update(AccountDelivery)
          .set({ IsDefault: false })
          .where('Account_ID = :accountId AND ID != :currentId', {
            accountId,
            currentId: deliveryId,
          })
          .execute();
      }

      // Cập nhật IsDefault của chính bản ghi này
      await manager.update(AccountDelivery, deliveryId, {
        IsDefault: dto.IsDefault,
      });

      return { success: true };
    });
  }

  async delete(accountId: number, deliveryId: number) {
    return this.dataSource.transaction(async (manager) => {
      // Lấy thông tin bản ghi AccountDelivery cần xóa
      const accountDelivery = await manager.findOne(AccountDelivery, {
        where: {
          ID: deliveryId,
          Account: { ID: accountId },
        },
        relations: ['Account', 'DeliveryAddress'],
      });

      if (!accountDelivery) {
        throw new NotFoundException(
          'Địa chỉ không tồn tại hoặc không thuộc tài khoản này.',
        );
      }

      const isDefault = accountDelivery.IsDefault;
      const deliveryAddressId = accountDelivery.DeliveryAddress.ID;

      // Xóa bản ghi AccountDelivery
      await manager.delete(AccountDelivery, deliveryId);

      // Nếu là địa chỉ mặc định, chuyển một địa chỉ khác làm mặc định
      if (isDefault) {
        const other = await manager.findOne(AccountDelivery, {
          where: { Account: { ID: accountId } },
          order: { ID: 'ASC' },
        });

        if (other) {
          await manager.update(AccountDelivery, other.ID, {
            IsDefault: true,
          });
        }
      }

      // // Kiểm tra xem DeliveryAddress có được dùng ở nơi khác không
      // const usedElsewhere = await manager.count(AccountDelivery, {
      //   where: { DeliveryAddress: { ID: deliveryAddressId } },
      // });

      // if (usedElsewhere === 0) {
      //   await manager.delete(DeliveryAddress, deliveryAddressId);
      // }

      await manager.delete(DeliveryAddress, deliveryAddressId);

      return { success: true };
    });
  }

  findAll() {
    return this.accountDeliveryRepo.find({
      relations: ['Account', 'DeliveryAddress'],
    });
  }

  findOne(id: number) {
    return this.accountDeliveryRepo.findOne({
      where: { ID: id },
      relations: ['Account', 'DeliveryAddress'],
    });
  }
  findByAccountId(accountId: number) {
    return this.accountDeliveryRepo.find({
      where: {
        Account: { ID: accountId },
      },
      relations: ['Account', 'DeliveryAddress'],
    });
  }
  findByAddressId(addressId: number) {
    return this.accountDeliveryRepo.findOne({
      where: {
        DeliveryAddress: { ID: addressId },
      },
      relations: ['Account', 'DeliveryAddress'],
    });
  }
}
