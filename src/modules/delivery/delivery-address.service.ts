import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAddress } from 'src/entities/delivery_address.entity';
import { CreateDeliveryAddressDto } from 'src/DTO/delivery/create-delivery-address.dto';
import { UpdateDeliveryAddressDto } from 'src/DTO/delivery/update-delivery-address.dto';

@Injectable()
export class DeliveryAddressService {
  constructor(
    @InjectRepository(DeliveryAddress)
    private readonly repo: Repository<DeliveryAddress>,
  ) {}

  async create(dto: CreateDeliveryAddressDto) {
    const address = this.repo.create(dto);
    return this.repo.save(address);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const found = await this.repo.findOneBy({ ID: id });
    if (!found) throw new NotFoundException('Address not found');
    return found;
  }

  async update(id: number, dto: UpdateDeliveryAddressDto) {
    const address = await this.findOne(id);
    return this.repo.save({ ...address, ...dto });
  }

  async remove(id: number) {
    const address = await this.findOne(id);
    return this.repo.remove(address);
  }
}
