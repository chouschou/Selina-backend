import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryAddressController } from './delivery-address.controller';
import { DeliveryAddressService } from './delivery-address.service';
import { DeliveryAddress } from 'src/entities/delivery_address.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryAddress]), AuthModule],
  controllers: [DeliveryAddressController],
  providers: [DeliveryAddressService],
})
export class DeliveryAddressModule {}
