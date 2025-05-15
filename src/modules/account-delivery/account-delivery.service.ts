import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDeliveryDto } from 'src/DTO/account-delivery/create-account-delivery.dto';
import { Account } from 'src/entities/account.entity';
import { AccountDelivery } from 'src/entities/account_delivery.entity';
import { DeliveryAddress } from 'src/entities/delivery_address.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccountDeliveryService {
  constructor(
    @InjectRepository(AccountDelivery)
    private readonly accountDeliveryRepo: Repository<AccountDelivery>,
    @InjectRepository(DeliveryAddress)
    private readonly deliveryAddressRepo: Repository<DeliveryAddress>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

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
    const account = await this.accountRepo.findOneBy({ ID: accountId });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Tạo địa chỉ giao hàng mới
    const address = this.deliveryAddressRepo.create(dto);
    await this.deliveryAddressRepo.save(address);

    // Gắn vào bảng AccountDelivery
    const accountDelivery = new AccountDelivery();
    accountDelivery.Account = account;
    accountDelivery.DeliveryAddress = address;

    return this.accountDeliveryRepo.save(accountDelivery);
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
