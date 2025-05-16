import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CalculateShippingFeeDto } from 'src/DTO/shipping-fee/calculate-fee.dto';
import { CreateShippingFeeDto } from 'src/DTO/shipping-fee/create-shipping-fee.dto';
import { UpdateShippingFeeDto } from 'src/DTO/shipping-fee/update-shipping-fee.dto';
import { ShippingFee } from 'src/entities/shipping_fee.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ShippingFeeService {
  constructor(
    @InjectRepository(ShippingFee)
    private readonly shippingFeeRepo: Repository<ShippingFee>,
  ) {}

  async create(dto: CreateShippingFeeDto): Promise<ShippingFee> {
    const fee = this.shippingFeeRepo.create(dto);
    return this.shippingFeeRepo.save(fee);
  }

  async findAll(): Promise<ShippingFee[]> {
    return this.shippingFeeRepo.find();
  }

  async calculateShippingFee(dto: CalculateShippingFeeDto): Promise<number> {
    const config = await this.shippingFeeRepo.findOneBy({
      StoreLocation: dto.StoreLocation,
    });

    if (!config) throw new NotFoundException('Store location not found');

    const { BasicFee, BasicDistance, Surcharge, SurchargeUnit } = config;
    const kc = dto.Distance;
    const a = Number(BasicDistance);
    const b = Number(Surcharge);
    const c = Number(SurchargeUnit);

    const extraFee = kc > a ? ((kc - a) * b) / c : 0;
    return Number(BasicFee) + extraFee;
  }

  async update(id: number, dto: UpdateShippingFeeDto): Promise<ShippingFee> {
    const fee = await this.shippingFeeRepo.findOneBy({ ID: id });
    if (!fee) throw new NotFoundException('Shipping fee config not found');

    // Ghi đè tất cả trường (không dùng Object.assign để tránh thiếu sót kiểu)
    fee.StoreLocation = dto.StoreLocation;
    fee.BasicFee = dto.BasicFee;
    fee.BasicDistance = dto.BasicDistance;
    fee.Surcharge = dto.Surcharge;
    fee.SurchargeUnit = dto.SurchargeUnit;

    return this.shippingFeeRepo.save(fee);
  }
}
