import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountDeliveryService } from './account-delivery.service';
import { AccountDeliveryController } from './account-delivery.controller';
import { AccountDelivery } from 'src/entities/account_delivery.entity';
import { DeliveryAddress } from 'src/entities/delivery_address.entity';
import { Account } from 'src/entities/account.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountDelivery, DeliveryAddress, Account]),
    AuthModule,
  ],
  exports: [TypeOrmModule],
  providers: [AccountDeliveryService],
  controllers: [AccountDeliveryController],
})
export class AccountDeliveryModule {}
