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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from 'src/DTO/orders/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
}
