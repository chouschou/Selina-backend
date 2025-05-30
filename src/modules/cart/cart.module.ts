import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Account } from 'src/entities/account.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Cart } from 'src/entities/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Account, GlassColor])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
