import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { StatisticsService } from './statistics.service';
import { Glass } from 'src/entities/glass.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { AuthModule } from '../auth/auth.module';
import { OrderStatus } from 'src/entities/order_status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderDetail,
      Glass,
      GlassColor,
      OrderStatus,
    ]),
    AuthModule,
  ],
  providers: [StatisticsService],
  controllers: [StatisticsController],
})
export class StatisticsModule {}
