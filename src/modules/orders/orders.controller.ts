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
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from 'src/DTO/orders/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateOrderRefundDto } from 'src/DTO/orders/update-order-refund.dto';
import { UpdateOrderStatusDto } from 'src/DTO/orders/update-order-status.dto';
import { Request } from 'express';
import { VnpayService } from '../vnpay/vnpay.service';
import { vnp_Config } from '../vnpay/vnpay.config';
import * as qs from 'qs';
import * as crypto from 'crypto';
import { Response } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly vnpayService: VnpayService,
  ) {}

  // @Get('vnpay-url/:orderId')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('customer')
  // async getVNPayUrl(
  //   @Param('orderId') orderId: number,
  //   @Req() req: Request,
  // ): Promise<{ url: string }> {
  //   const order = await this.ordersService.findOne(orderId);
  //   if (!order) throw new NotFoundException('Order not found');
  //   // const clientIp = req.ip || '127.0.0.1';
  //   const rawIp = req.ip ?? req.connection?.remoteAddress ?? '127.0.0.1';
  //   const clientIp = rawIp === '::1' ? '127.0.0.1' : rawIp;

  //   const url = this.vnpayService.createPaymentUrl(
  //     order.ID,
  //     order.Total,
  //     clientIp,
  //   );
  //   return { url };
  // }
  sortObject(obj: Record<string, string>) {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
    return sorted;
  }

  @Get('vnpay-return')
  async handleVNPayReturn(@Query() query: any, @Res() res: Response) {
    const { vnp_SecureHash, vnp_TxnRef, vnp_ResponseCode } = query;
    console.log('VNPay IPN Return query:', query);

    const orderId = parseInt(vnp_TxnRef.split('_')[0]);

    const params = { ...query };
    delete params.vnp_SecureHash;

    const sortedParams = this.sortObject(query);
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const checkSum = crypto
      .createHmac('sha512', vnp_Config.vnp_HashSecret!)
      .update(signData)
      .digest('hex');

    // if (checkSum !== vnp_SecureHash) {
    //   return res.redirect(`${vnp_Config.returnUrl}?success=false`);
    // }

    console.log('VNPay Response Code:', vnp_ResponseCode);
    console.log('Order ID:', orderId);
    console.log('Transaction No:', query.vnp_TransactionNo);
    if (vnp_ResponseCode === '00') {
      await this.ordersService.markOrderAsPaid(
        orderId,
        query.vnp_TransactionNo,
      );

      return res.redirect(
        `${vnp_Config.returnUrl}?success=true&orderId=${orderId}&amount=${query.vnp_Amount}`,
      );
    } else {
      return res.redirect(
        `${vnp_Config.returnUrl}?success=false&orderId=${orderId}&amount=${query.vnp_Amount}&errorCode=${vnp_ResponseCode}`,
      );
    }
  }

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

  @Get('by-account/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'employee', 'owner')
  getOrdersByAccount(@Param('accountId', ParseIntPipe) accountId: number) {
    return this.ordersService.findByAccountId(accountId);
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
