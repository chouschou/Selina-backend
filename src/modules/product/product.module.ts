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

@Module({
  imports: [
    TypeOrmModule.forFeature([Glass, GlassColor, OrderDetail, Image]),
    AuthModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ImageService],
})
export class ProductModule {}
