import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entities';
import { RoleModule } from './modules/role/role.module';
import { AuthModule } from './modules/auth/auth.module';
import { GlassModule } from './modules/glass/glass.module';
import { GlassColorModule } from './modules/glass-color/glass-color.module';
import { ProductModule } from './modules/product/product.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccountDeliveryModule } from './modules/account-delivery/account-delivery.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AiModule } from './modules/AI/AI.module';
import { Voucher } from './entities/voucher.entity';
import { VoucherModule } from './modules/voucher/voucher.module';
import { ShippingFee } from './entities/shipping_fee.entity';
import { ShippingFeeModule } from './modules/shipping-fee/shipping-fee.module';
import { ChatModule } from './modules/chat/chat.module';
import { UserInfoModule } from './modules/user/user-info.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '10042003',
      database: 'selina_store',
      entities: entities,
      synchronize: false,
    }),
    RoleModule,
    AuthModule,
    AccountDeliveryModule,
    GlassModule,
    GlassColorModule,
    ProductModule,
    OrdersModule,
    PassportModule,
    JwtModule,
    AiModule,
    VoucherModule,
    ShippingFeeModule,
    ChatModule,
    UserInfoModule,
  ],
})
export class AppModule {}
