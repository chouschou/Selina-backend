import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Glass } from 'src/entities/glass.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../auth/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { ImageService } from '../image/image.service';
import { Image } from 'src/entities/image.entity';
import { S3Module } from 'src/shared/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Glass, GlassColor, OrderDetail, Image]),
    AuthModule,
    S3Module,
  ],
  controllers: [ProductController],
  providers: [ProductService, ImageService],
  exports: [ProductService],
})
export class ProductModule {}
