import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingFeeService } from './shipping-fee.service';
import { ShippingFeeController } from './shipping-fee.controller';
import { ShippingFee } from 'src/entities/shipping_fee.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingFee]), AuthModule],
  controllers: [ShippingFeeController],
  providers: [ShippingFeeService],
})
export class ShippingFeeModule {}
