import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { AuthModule } from '../auth/auth.module';
import { AccountDeliveryModule } from '../account-delivery/account-delivery.module';
import { OrderStatus } from 'src/entities/order_status.entity';
import { OrderRefund } from 'src/entities/order_refund.entity';
import { VnpayService } from '../vnpay/vnpay.service';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Rating } from 'src/entities/rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderDetail,
      OrderStatus,
      OrderRefund,
      GlassColor,
      Rating,
    ]),
    AccountDeliveryModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, VnpayService],
})
export class OrdersModule {}
