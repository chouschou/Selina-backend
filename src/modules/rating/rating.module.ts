import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { Rating } from 'src/entities/rating.entity';
import { Image } from 'src/entities/image.entity';
import { OrderStatus } from 'src/entities/order_status.entity';
import { GlassColor } from 'src/entities/glass_color.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rating,
      OrderDetail,
      OrderStatus,
      Image,
      GlassColor,
    ]),
  ],
  providers: [RatingService],
  controllers: [RatingController],
})
export class RatingModule {}
