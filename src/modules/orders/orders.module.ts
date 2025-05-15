import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { AuthModule } from '../auth/auth.module';
import { AccountDeliveryModule } from '../account-delivery/account-delivery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail]),
    AccountDeliveryModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
