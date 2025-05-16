import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ShippingFeeService } from './shipping-fee.service';
import { CreateShippingFeeDto } from 'src/DTO/shipping-fee/create-shipping-fee.dto';
import { CalculateShippingFeeDto } from 'src/DTO/shipping-fee/calculate-fee.dto';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateShippingFeeDto } from 'src/DTO/shipping-fee/update-shipping-fee.dto';

@Controller('shipping-fee')
export class ShippingFeeController {
  constructor(private readonly shippingFeeService: ShippingFeeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  create(@Body() dto: CreateShippingFeeDto) {
    return this.shippingFeeService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  update(@Param('id') id: number, @Body() dto: UpdateShippingFeeDto) {
    return this.shippingFeeService.update(id, dto);
  }

  @Get()
  findAll() {
    return this.shippingFeeService.findAll();
  }

  @Post('calculate')
  calculate(@Body() dto: CalculateShippingFeeDto) {
    return this.shippingFeeService.calculateShippingFee(dto);
  }
}
