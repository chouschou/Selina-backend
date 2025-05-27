import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerInfoDto } from 'src/DTO/customer/customer-info.dto';
import { StoreInfoDto } from 'src/DTO/store/store-info.dto';
import { Customer } from 'src/entities/customer.entity';
import { Store } from 'src/entities/store.entity';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserInfoService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,

    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
  ) {}

  async getCustomerByAccountId(accountId: number): Promise<CustomerInfoDto> {
    const customer = await this.customerRepo.findOne({
      where: { Account: { ID: accountId } },
      relations: ['Account'],
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return plainToInstance(CustomerInfoDto, customer, {
      excludeExtraneousValues: true,
    });
  }

  async getStoreByAccountId(accountId: number): Promise<StoreInfoDto> {
    const store = await this.storeRepo.findOne({
      where: { Account: { ID: accountId } },
      relations: ['Account'],
    });
    if (!store) throw new NotFoundException('Store not found');

    return plainToInstance(StoreInfoDto, store, {
      excludeExtraneousValues: true,
    });
  }
}
