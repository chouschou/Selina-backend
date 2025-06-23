import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { Rating } from 'src/entities/rating.entity';
import { Image } from 'src/entities/image.entity';
import { OrderStatus } from 'src/entities/order_status.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { S3Module } from 'src/shared/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rating,
      OrderDetail,
      OrderStatus,
      Image,
      GlassColor,
    ]),
    S3Module,
  ],
  providers: [RatingService],
  controllers: [RatingController],
})
export class RatingModule {}
