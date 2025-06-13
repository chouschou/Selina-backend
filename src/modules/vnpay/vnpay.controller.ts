import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Post('create-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  createPayment(@Body() order: any, @Req() req: any) {
    console.log('Creating payment for order:', order);
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = rawIp === '::1' ? '127.0.0.1' : rawIp;
    return { url: this.vnpayService.createPaymentUrl(order, ip) };
  }
}
