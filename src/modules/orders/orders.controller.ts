import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from 'src/DTO/orders/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateOrderRefundDto } from 'src/DTO/orders/update-order-refund.dto';
import { UpdateOrderStatusDto } from 'src/DTO/orders/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  create(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    console.log('req Id in controller ', req.user);
    const accountId = req.user.userId; // JWT payload phải chứa `id`
    console.log('account Id in controller ', accountId);
    return this.ordersService.create(createOrderDto, accountId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'employee', 'owner')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'employee', 'owner')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employee', 'owner', 'customer')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':orderId/refund')
  @Roles('employee', 'owner')
  updateRefund(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderRefundDto,
  ) {
    return this.ordersService.updateRefundStatus(orderId, dto);
  }
}
